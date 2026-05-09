from fastapi import APIRouter

from app.models.auth import RegisterRequest, LoginRequest, UserResponse, UpdateUserRequest
from app.services.auth import register_user, login_user, check_login_id_available, update_user

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


@router.get("/check-login-id")
def check_id(login_id: str):
    return {"available": check_login_id_available(login_id)}


@router.put("/users/{user_id}", response_model=UserResponse)
def update_profile(user_id: str, request: UpdateUserRequest):
    return update_user(user_id, request.student_id, request.name, request.password)
