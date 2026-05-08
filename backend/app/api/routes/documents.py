import os

from fastapi import APIRouter, File, UploadFile, HTTPException, Request, Form, BackgroundTasks
from fastapi.responses import HTMLResponse

from app.core.config import MAX_FILE_SIZE
from app.models.document import UploadResponse
from app.services.document import validate_file, upload_document, process_document_rag

router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    request: Request,
    file: UploadFile = File(...),
    student_id: str = Form(None),
    category_id: int = Form(None)
):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="파일 크기는 50MB를 초과할 수 없습니다.")

    original_name = os.path.basename(file.filename or "")[:255]

    try:
        contents = await file.read()
    finally:
        await file.close()

    # 파일 유효성 검사
    ext = validate_file(original_name, contents)
    
    # DB 및 스토리지 저장 (PENDING 상태)
    document_id = upload_document(original_name, contents, ext, student_id, category_id)

    # RAG 처리를 백그라운드 태스크로 예약
    background_tasks.add_task(process_document_rag, document_id)

    return UploadResponse(
        document_id=document_id,
        file_path=f"storage/documents/{document_id}", # 예시 경로
        original_file_name=original_name
    )
