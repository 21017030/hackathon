import logging
import traceback
import os
import tempfile
import fitz  # PyMuPDF
from google.genai import types

from app.core.supabase import supabase
from app.core.gemini import client, CHAT_MODEL, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS, CHUNK_SIZE

logger = logging.getLogger(__name__)


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


async def process_document_rag(document_id: int):
    """
    RAG 인제스천 파이프라인:
    1. 파일 다운로드
    2. 텍스트 추출 (Gemini 멀티모달 우선, PyMuPDF 폴백)
    3. 청킹
    4. 임베딩 생성
    5. 벡터 DB 저장
    6. 상태 업데이트
    """
    try:
        res = supabase.table("documents").select("*").eq("id", document_id).single().execute()
        doc_data = res.data
        if not doc_data:
            logger.error(f"문서 ID {document_id}를 찾을 수 없습니다.")
            return

        file_path = doc_data["file_path"]
        file_bytes = supabase.storage.from_("documents").download(file_path)

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

        chunks = [text[i:i + CHUNK_SIZE] for i in range(0, len(text), CHUNK_SIZE)]

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

            supabase.table("document_chunks").insert({
                "document_id": document_id,
                "content": chunk_content,
                "embedding": embedding_vector,
                "chunk_index": i
            }).execute()

        supabase.table("documents").update({"parsing_status": "COMPLETED"}).eq("id", document_id).execute()
        logger.info(f"문서 {document_id} RAG 처리 완료")

    except Exception as e:
        logger.error(f"문서 {document_id} RAG 처리 중 오류: {e}\n{traceback.format_exc()}")
        supabase.table("documents").update({"parsing_status": "FAILED"}).eq("id", document_id).execute()
