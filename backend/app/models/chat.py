from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ChatSessionCreate(BaseModel):
    student_id: str
    title: str

class ChatSessionResponse(BaseModel):
    id: int
    student_id: str
    title: str
    created_at: datetime

class ChatAskRequest(BaseModel):
    session_id: int
    content: str # 질문 내용
    document_ids: Optional[List[int]] = None # 특정 문서만 검색하고 싶을 때

class ChatMessageResponse(BaseModel):
    id: int
    sender_type: str # 'USER' or 'AI'
    content: str
    created_at: datetime
    sources: Optional[List] = []
