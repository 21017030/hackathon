from fastapi import APIRouter

from app.core.supabase import supabase

router = APIRouter(prefix="/test", tags=["test"])


@router.get("/users")
def get_users():
    res = supabase.table("users").select("student_id, name, login_id").limit(5).execute()
    return {"users": res.data}


@router.get("/categories")
def get_categories():
    res = supabase.table("categories").select("*").limit(5).execute()
    return {"categories": res.data}


@router.get("/documents")
def get_documents():
    res = supabase.table("documents").select("*").limit(5).execute()
    return {"documents": res.data}


@router.get("/chat-sessions")
def get_chat_sessions():
    res = supabase.table("chat_sessions").select("*").limit(5).execute()
    return {"chat_sessions": res.data}


@router.get("/chat-messages")
def get_chat_messages():
    res = supabase.table("chat_messages").select("*").limit(5).execute()
    return {"chat_messages": res.data}
