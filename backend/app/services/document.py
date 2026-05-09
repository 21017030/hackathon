import logging
import traceback
import uuid
import os
import tempfile
import fitz  # PyMuPDF
from typing import List
from google import genai
from google.genai import types

from fastapi import HTTPException

from app.core.config import MAX_FILE_SIZE, GEMINI_API_KEY
from app.core.supabase import supabase

logger = logging.getLogger(__name__)

# Gemini API 설정
client = genai.Client(api_key=GEMINI_API_KEY)

# 사용할 모델 정의
CHAT_MODEL = "gemini-2.5-flash"
EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSIONS = 1536  # pgvector HNSW 인덱스 호환 (최대 2000차원)

MAGIC_NUMBERS = {
    ".pdf": b"%PDF",
}

CONTENT_TYPES = {
    ".pdf": "application/pdf",
}

ALLOWED_EXTENSIONS = {".pdf"}


def validate_file(original_name: str, contents: bytes) -> str:
    ext = os.path.splitext(original_name)[1].lower()
    if not original_name or ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="PDF 파일만 업로드할 수 있습니다.")

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="파일 크기는 50MB를 초과할 수 없습니다.")

    magic = MAGIC_NUMBERS.get(ext)
    if magic and not contents.startswith(magic):
        raise HTTPException(status_code=400, detail="파일 형식이 올바르지 않습니다.")

    return ext


def _extract_pdf_gemini(file_bytes: bytes, filename: str) -> str:
    """Gemini Files API로 PDF 전체 내용 추출 (이미지/표/차트 포함)."""
    tmp_path = None
    uploaded_file = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(file_bytes)
            tmp_path = f.name

        uploaded_file = client.files.upload(
            path=tmp_path,
            config=types.UploadFileConfig(
                mime_type="application/pdf",
                display_name=filename,
            ),
        )

        response = client.models.generate_content(
            model=CHAT_MODEL,
            contents=[
                uploaded_file,
                "이 PDF 문서의 전체 내용을 텍스트로 추출해주세요. "
                "각 페이지가 시작될 때마다 반드시 '[N페이지]' 형식으로 페이지 번호를 표시하세요. "
                "표, 이미지, 그래프, 차트가 있으면 그 내용도 설명해주세요. "
                "마크다운 형식 없이 순수 텍스트로만 출력하세요.",
            ],
        )
        return response.text or ""
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        if uploaded_file:
            try:
                client.files.delete(name=uploaded_file.name)
            except Exception:
                pass


def upload_document(original_name: str, contents: bytes, ext: str, student_id: str = None, category_id: int = None) -> int:
    file_path = f"{uuid.uuid4()}{ext}"

    try:
        content_type = CONTENT_TYPES[ext]
        supabase.storage.from_("documents").upload(file_path, contents, {"content-type": content_type})
    except Exception as e:
        logger.error("스토리지 업로드 실패: %s", e)
        raise HTTPException(status_code=500, detail="파일 저장 중 오류가 발생했습니다.")

    try:
        res = supabase.table("documents").insert({
            "student_id": student_id,
            "category_id": category_id,
            "original_file_name": original_name,
            "file_path": file_path,
            "parsing_status": "PENDING",
        }).execute()
        
        if not res.data:
            raise Exception("DB insert result is empty")
            
        return res.data[0]["id"]
    except Exception as e:
        logger.error("DB 저장 실패: %s", e)
        try:
            supabase.storage.from_("documents").remove([file_path])
        except Exception as cleanup_err:
            logger.error("스토리지 정리 실패: %s", cleanup_err)
        raise HTTPException(status_code=500, detail="파일 정보 저장 중 오류가 발생했습니다.")


async def process_document_rag(document_id: int):
    """
    RAG 인제스션 파이프라인 (Gemini 버전):
    1. 파일 다운로드
    2. 텍스트 추출
    3. 청킹
    4. Gemini 임베딩 생성
    5. 벡터 DB 저장
    6. 상태 업데이트
    """
    try:
        # 1. 문서 정보 가져오기
        res = supabase.table("documents").select("*").eq("id", document_id).single().execute()
        doc_data = res.data
        if not doc_data:
            logger.error(f"문서 ID {document_id}를 찾을 수 없습니다.")
            return

        file_path = doc_data["file_path"]
        ext = os.path.splitext(file_path)[1].lower()

        # 2. 파일 다운로드
        file_bytes = supabase.storage.from_("documents").download(file_path)

        # 3. 텍스트 추출 (Gemini 멀티모달 우선, PyMuPDF 폴백)
        text = ""
        try:
            text = _extract_pdf_gemini(file_bytes, doc_data["original_file_name"])
            logger.info(f"문서 {document_id} Gemini 멀티모달 추출 완료 ({len(text)}자)")
        except Exception as e:
            logger.warning(f"Gemini 추출 실패, PyMuPDF 폴백: {e}")
            with fitz.open(stream=file_bytes, filetype="pdf") as pdf:
                for page in pdf:
                    text += page.get_text()

        if not text.strip():
            raise Exception("추출된 텍스트가 없습니다.")

        # 4. 청킹
        chunk_size = 1000  # Gemini는 컨텍스트 윈도우가 크므로 약간 더 크게 잡아도 좋습니다.
        chunks = [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]

        # 5. 임베딩 생성 및 저장
        for i, chunk_content in enumerate(chunks):
            embedding_res = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=chunk_content,
                config=types.EmbedContentConfig(
                    task_type="retrieval_document",
                    output_dimensionality=EMBEDDING_DIMENSIONS,
                ),
            )
            embedding_vector = embedding_res.embeddings[0].values

            # document_chunks 테이블에 저장
            supabase.table("document_chunks").insert({
                "document_id": document_id,
                "content": chunk_content,
                "embedding": embedding_vector,
                "chunk_index": i
            }).execute()

        # 6. 상태 업데이트
        supabase.table("documents").update({"parsing_status": "COMPLETED"}).eq("id", document_id).execute()
        logger.info(f"문서 {document_id} RAG 처리 완료 (Gemini 사용)")

    except Exception as e:
        logger.error(f"문서 {document_id} RAG 처리 중 오류: {e}\n{traceback.format_exc()}")
        supabase.table("documents").update({"parsing_status": "FAILED"}).eq("id", document_id).execute()


def get_document_view(document_id: int) -> dict:
    res = supabase.table("documents").select("*").eq("id", document_id).single().execute()
    doc = res.data
    if not doc:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")

    ext = os.path.splitext(doc["file_path"])[1].lower()

    try:
        signed = supabase.storage.from_("documents").create_signed_url(doc["file_path"], 3600)
        signed_url = signed.get("signedURL") or signed.get("signedUrl") or ""
    except Exception:
        signed_url = ""

    chunks_res = (
        supabase.table("document_chunks")
        .select("content, chunk_index")
        .eq("document_id", document_id)
        .order("chunk_index")
        .execute()
    )
    content = "\n".join(c["content"] for c in chunks_res.data) if chunks_res.data else ""

    return {
        "filename": doc["original_file_name"],
        "ext": ext,
        "signed_url": signed_url,
        "content": content,
    }


def get_documents_by_student(student_id: str) -> list:
    res = supabase.table("documents").select("*").eq("student_id", student_id).order("created_at", desc=True).execute()
    return res.data


def get_documents_by_category(category_id: int) -> list:
    res = supabase.table("documents").select("*").eq("category_id", category_id).order("created_at", desc=True).execute()
    return res.data


def delete_document(document_id: int) -> None:
    res = supabase.table("documents").select("file_path").eq("id", document_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")

    file_path = res.data[0]["file_path"]

    # 청크 먼저 삭제 (FK 제약)
    try:
        supabase.table("document_chunks").delete().eq("document_id", document_id).execute()
    except Exception as e:
        logger.error("청크 삭제 실패: %s", e)
        raise HTTPException(status_code=500, detail="문서 청크 삭제 중 오류가 발생했습니다.")

    # 문서 레코드 삭제
    try:
        supabase.table("documents").delete().eq("id", document_id).execute()
    except Exception as e:
        logger.error("문서 DB 삭제 실패: %s", e)
        raise HTTPException(status_code=500, detail="문서 정보 삭제 중 오류가 발생했습니다.")

    # 스토리지 파일 삭제
    try:
        supabase.storage.from_("documents").remove([file_path])
    except Exception as e:
        logger.warning("스토리지 파일 삭제 실패 (이미 없을 수 있음): %s", e)
