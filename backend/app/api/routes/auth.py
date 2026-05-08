from fastapi import APIRouter, HTTPException

from app.models.auth import RegisterRequest, LoginRequest, UserResponse
from app.services.auth import register_user, login_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(request: RegisterRequest):
    return register_user(
        student_id=request.student_id,
        login_id=request.login_id,
        password=request.password,
        name=request.name,
    )


@router.post("/login", response_model=UserResponse)
def login(request: LoginRequest):
    return login_user(login_id=request.login_id, password=request.password)
