from pydantic import BaseModel
from typing import Optional


class RegisterRequest(BaseModel):
    student_id: str
    login_id: str
    password: str
    name: str


class LoginRequest(BaseModel):
    login_id: str
    password: str


class UserResponse(BaseModel):
    id: str
    student_id: str
    login_id: str
    name: str


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None
