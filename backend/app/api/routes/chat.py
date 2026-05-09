from fastapi import APIRouter, HTTPException
from typing import List

from app.models.chat import ChatSessionCreate, ChatSessionResponse, ChatAskRequest, ChatMessageResponse
from app.services.chat import ask_question, delete_session
from app.core.supabase import supabase

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/session", response_model=ChatSessionResponse)
async def create_session(request: ChatSessionCreate):
    try:
        res = supabase.table("chat_sessions").insert({
            "user_id": request.user_id,
            "title": request.title
        }).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/{user_id}", response_model=List[ChatSessionResponse])
async def get_sessions(user_id: str):
    res = supabase.table("chat_sessions").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return res.data

@router.post("/ask")
async def ask(request: ChatAskRequest):
    try:
        return await ask_question(request.session_id, request.content, request.document_ids)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/messages/{session_id}", response_model=List[ChatMessageResponse])
async def get_messages(session_id: int):
    res = supabase.table("chat_messages").select("*").eq("session_id", session_id).order("created_at", desc=False).execute()
    return res.data

@router.delete("/sessions/{session_id}", status_code=204)
async def remove_session(session_id: int):
    delete_session(session_id)
