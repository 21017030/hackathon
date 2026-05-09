from fastapi import APIRouter
from typing import List

from app.models.category import CategoryCreate, CategoryResponse
from app.services.category import create_category, get_categories, delete_category

router = APIRouter(prefix="/categories", tags=["categories"])


@router.post("", response_model=CategoryResponse, status_code=201)
def create(request: CategoryCreate):
    return create_category(user_id=request.user_id, name=request.name)


@router.get("/{user_id}", response_model=List[CategoryResponse])
def list_categories(user_id: str):
    return get_categories(user_id)


@router.delete("/{category_id}", status_code=204)
def delete(category_id: int):
    delete_category(category_id)
