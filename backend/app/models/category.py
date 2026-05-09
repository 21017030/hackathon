from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CategoryCreate(BaseModel):
    user_id: str
    name: str


class CategoryResponse(BaseModel):
    id: int
    user_id: Optional[str]
    name: str
    created_at: datetime
