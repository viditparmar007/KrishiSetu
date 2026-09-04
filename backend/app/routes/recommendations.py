from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_role
from app.models.user import User

from app.schemas.recommendation import (
    CentreRecommendationOut,
    LeaveTimeOut,
    SlotRecommendationOut,
)

from app.services.recommendation_service import (
    get_leave_time,
    recommend_centres,
    recommend_slots,
)


router = APIRouter(
    prefix="/api/v1/recommendations",
    tags=["Recommendations"],
)


@router.get(
    "/centres",
    response_model=list[CentreRecommendationOut],
)
def recommended_centres(
    limit: int = Query(default=5, ge=1, le=10),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("FARMER")
    ),
):
    return recommend_centres(
        db,
        current_user,
        limit,
    )


@router.get(
    "/slots/{centre_id}",
    response_model=list[SlotRecommendationOut],
)
def recommended_slots(
    centre_id: int,
    limit: int = Query(default=5, ge=1, le=10),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("FARMER")
    ),
):
    return recommend_slots(
        db,
        centre_id,
        limit,
    )


@router.get(
    "/leave-time/{booking_id}",
    response_model=LeaveTimeOut,
)
def recommended_leave_time(
    booking_id: int,
    travel_minutes: int = Query(ge=1, le=600),
    safety_buffer_minutes: int = Query(
        default=15,
        ge=0,
        le=180,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("FARMER")
    ),
):
    return get_leave_time(
        db,
        current_user,
        booking_id,
        travel_minutes,
        safety_buffer_minutes,
    )