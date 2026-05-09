from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UploadResponse(BaseModel):
    document_id: int
    file_path: str
    original_file_name: str


class DocumentResponse(BaseModel):
    id: int
    user_id: Optional[str]
    category_id: Optional[int]
    original_file_name: str
    parsing_status: str
    created_at: datetime
