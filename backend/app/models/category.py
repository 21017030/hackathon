from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CategoryCreate(BaseModel):
    student_id: str
    name: str


class CategoryResponse(BaseModel):
    id: int
    student_id: Optional[str]
    name: str
    created_at: datetime
