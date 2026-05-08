import logging
from fastapi import HTTPException
from passlib.context import CryptContext

from app.core.supabase import supabase

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def register_user(student_id: str, login_id: str, password: str, name: str) -> dict:
    # 중복 확인
    existing = supabase.table("users").select("student_id").eq("login_id", login_id).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="이미 사용 중인 아이디입니다.")

    existing_sid = supabase.table("users").select("student_id").eq("student_id", student_id).execute()
    if existing_sid.data:
        raise HTTPException(status_code=409, detail="이미 등록된 학번입니다.")

    hashed = pwd_context.hash(password)
    try:
        res = supabase.table("users").insert({
            "student_id": student_id,
            "login_id": login_id,
            "password": hashed,
            "name": name,
        }).execute()
        user = res.data[0]
        return {"student_id": user["student_id"], "login_id": user["login_id"], "name": user["name"]}
    except Exception as e:
        logger.error("회원가입 실패: %s", e)
        raise HTTPException(status_code=500, detail="회원가입 처리 중 오류가 발생했습니다.")


def login_user(login_id: str, password: str) -> dict:
    res = supabase.table("users").select("*").eq("login_id", login_id).execute()
    if not res.data:
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다.")

    user = res.data[0]
    if not pwd_context.verify(password, user["password"]):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다.")

    return {"student_id": user["student_id"], "login_id": user["login_id"], "name": user["name"]}
