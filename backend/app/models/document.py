from pydantic import BaseModel


class UploadResponse(BaseModel):
    document_id: int
    file_path: str
    original_file_name: str
