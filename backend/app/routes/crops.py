from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.crop import CropCreate, CropOut, CropUpdate
from app.services.crop_service import (
    create_crop,
    delete_my_crop,
    get_my_crop,
    list_crops_for_farm,
    list_my_crops,
    update_my_crop,
)

router = APIRouter(prefix="/api/v1", tags=["Crops"])


@router.post("/farms/{farm_id}/crops", response_model=CropOut, status_code=201)
def create_crop_route(
    farm_id: int,
    payload: CropCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_crop(db, current_user, farm_id, payload)


@router.get("/farms/{farm_id}/crops", response_model=list[CropOut])
def list_farm_crops_route(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_crops_for_farm(db, current_user, farm_id)


@router.get("/crops", response_model=list[CropOut])
def list_all_my_crops_route(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_my_crops(db, current_user)


@router.get("/crops/{crop_id}", response_model=CropOut)
def get_crop_route(
    crop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_my_crop(db, current_user, crop_id)


@router.put("/crops/{crop_id}", response_model=CropOut)
def update_crop_route(
    crop_id: int,
    payload: CropUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_my_crop(db, current_user, crop_id, payload)


@router.delete("/crops/{crop_id}", status_code=204)
def delete_crop_route(
    crop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_my_crop(db, current_user, crop_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)