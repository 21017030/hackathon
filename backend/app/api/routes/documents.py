import os
from typing import List

from fastapi import APIRouter, File, UploadFile, HTTPException, Request, Form, BackgroundTasks

from app.core.config import MAX_FILE_SIZE
from app.models.document import UploadResponse, DocumentResponse
from app.services.document import (
    validate_file, upload_document, process_document_rag,
    get_documents_by_student, get_documents_by_category, delete_document,
    get_document_view,
)

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    request: Request,
    file: UploadFile = File(...),
    student_id: str = Form(None),
    category_id: int = Form(None),
):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="파일 크기는 50MB를 초과할 수 없습니다.")

    original_name = os.path.basename(file.filename or "")[:255]

    try:
        contents = await file.read()
    finally:
        await file.close()

    ext = validate_file(original_name, contents)
    document_id = upload_document(original_name, contents, ext, student_id, category_id)
    background_tasks.add_task(process_document_rag, document_id)

    return UploadResponse(
        document_id=document_id,
        file_path=f"storage/documents/{document_id}",
        original_file_name=original_name,
    )


@router.get("/student/{student_id}", response_model=List[DocumentResponse])
def list_by_student(student_id: str):
    return get_documents_by_student(student_id)


@router.get("/category/{category_id}", response_model=List[DocumentResponse])
def list_by_category(category_id: int):
    return get_documents_by_category(category_id)


@router.get("/{document_id}/view")
def view_document(document_id: int):
    return get_document_view(document_id)


@router.delete("/{document_id}", status_code=204)
def remove_document(document_id: int):
    delete_document(document_id)
