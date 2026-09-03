from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.farm import FarmCreate, FarmOut, FarmUpdate
from app.services.farm_service import (
    create_farm,
    delete_my_farm,
    get_my_farm,
    list_my_farms,
    update_my_farm,
)

router = APIRouter(prefix="/api/v1", tags=["Farms"])


@router.post("/farms", response_model=FarmOut, status_code=201)
def create_farm_route(
    payload: FarmCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_farm(db, current_user, payload)


@router.get("/farms", response_model=list[FarmOut])
def list_farms_route(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_my_farms(db, current_user)


@router.get("/farms/{farm_id}", response_model=FarmOut)
def get_farm_route(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_my_farm(db, current_user, farm_id)


@router.put("/farms/{farm_id}", response_model=FarmOut)
def update_farm_route(
    farm_id: int,
    payload: FarmUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_my_farm(db, current_user, farm_id, payload)


@router.delete("/farms/{farm_id}", status_code=204)
def delete_farm_route(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_my_farm(db, current_user, farm_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)