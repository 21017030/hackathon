import logging
import uuid
import os

from fastapi import HTTPException

from app.core.config import MAX_FILE_SIZE
from app.core.supabase import supabase

logger = logging.getLogger(__name__)

MAGIC_NUMBERS = {
    ".pdf":  b"%PDF",
    ".pptx": b"PK\x03\x04",
    ".docx": b"PK\x03\x04",
    ".ppt":  b"\xd0\xcf\x11\xe0",
}

CONTENT_TYPES = {
    ".pdf":  "application/pdf",
    ".ppt":  "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt":  "text/plain; charset=utf-8",
}

ALLOWED_EXTENSIONS = {".pdf", ".ppt", ".pptx", ".docx", ".txt"}


def validate_file(original_name: str, contents: bytes) -> str:
    ext = os.path.splitext(original_name)[1].lower()
    if not original_name or ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="허용되지 않는 파일 형식입니다.")

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="파일 크기는 50MB를 초과할 수 없습니다.")

    magic = MAGIC_NUMBERS.get(ext)
    if magic and not contents.startswith(magic):
        raise HTTPException(status_code=400, detail="파일 형식이 올바르지 않습니다.")

    if ext == ".txt":
        try:
            contents.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="파일 형식이 올바르지 않습니다.")

    return ext


def upload_document(original_name: str, contents: bytes, ext: str) -> str:
    file_path = f"{uuid.uuid4()}{ext}"

    try:
        content_type = CONTENT_TYPES[ext]
        supabase.storage.from_("documents").upload(file_path, contents, {"content-type": content_type})
    except Exception as e:
        logger.error("스토리지 업로드 실패: %s", e)
        raise HTTPException(status_code=500, detail="파일 저장 중 오류가 발생했습니다.")

    try:
        supabase.table("documents").insert({
            "original_file_name": original_name,
            "file_path": file_path,
            "parsing_status": "PENDING",
        }).execute()
    except Exception as e:
        logger.error("DB 저장 실패: %s", e)
        try:
            supabase.storage.from_("documents").remove([file_path])
        except Exception as cleanup_err:
            logger.error("스토리지 정리 실패 (좀비 파일 발생 가능): %s", cleanup_err)
        raise HTTPException(status_code=500, detail="파일 저장 중 오류가 발생했습니다.")

    return file_path
