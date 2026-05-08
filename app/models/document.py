from pydantic import BaseModel


class UploadResponse(BaseModel):
    file_path: str
    original_file_name: str
