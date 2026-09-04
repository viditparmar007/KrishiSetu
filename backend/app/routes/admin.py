from fastapi import (
    APIRouter,
    Depends,
    status,
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_role

from app.models.user import User

from app.schemas.centre import (
    CentreCreate,
    CentreOut,
    CentreUpdate,
)

from app.schemas.officer import (
    OfficerCreate,
    OfficerOut,
)

from app.schemas.slot import (
    SlotCreate,
    SlotOut,
)

from app.services.centre_service import (
    create_centre,
    list_all_centres,
    update_centre,
)

from app.services.officer_service import (
    create_officer,
    list_officers,
)

from app.services.slot_service import (
    create_slot_for_centre,
)
from datetime import date

from fastapi import Query

from app.models.enums import BookingStatus
from app.schemas.booking import BookingOut

from app.services.booking_service import (
    list_admin_bookings,
)
from app.schemas.payment import (
    PaymentOut,
    PaymentUpdate,
)

from app.services.payment_service import (
    list_admin_payments,
    update_admin_payment,
)


router = APIRouter(
    prefix="/api/v1/admin",
    tags=["Admin"],
)


@router.get(
    "/centres",
    response_model=list[CentreOut],
)
def admin_centres(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):

    return list_all_centres(db)


@router.post(
    "/centres",
    response_model=CentreOut,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_centre(
    payload: CentreCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):

    return create_centre(
        db,
        payload,
    )


@router.put(
    "/centres/{centre_id}",
    response_model=CentreOut,
)
def admin_update_centre(
    centre_id: int,
    payload: CentreUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):

    return update_centre(
        db,
        centre_id,
        payload,
    )


@router.get(
    "/officers",
    response_model=list[OfficerOut],
)
def admin_officers(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):

    return list_officers(db)


@router.post(
    "/officers",
    response_model=OfficerOut,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_officer(
    payload: OfficerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):

    return create_officer(
        db,
        payload,
    )


@router.post(
    "/centres/{centre_id}/slots",
    response_model=SlotOut,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_slot(
    centre_id: int,
    payload: SlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):

    return create_slot_for_centre(
        db,
        centre_id,
        payload,
    )

@router.get(
    "/bookings",
    response_model=list[BookingOut],
)
def admin_bookings(
    centre_id: int | None = Query(
        default=None
    ),

    booking_date: date | None = Query(
        default=None
    ),

    booking_status: BookingStatus | None = Query(
        default=None
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_role("ADMIN")
    ),
):
    return list_admin_bookings(
        db,
        centre_id,
        booking_date,
        booking_status,
    )

@router.get(
    "/payments",
    response_model=list[PaymentOut],
)
def admin_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):
    return list_admin_payments(
        db
    )


@router.put(
    "/payments/{payment_id}",
    response_model=PaymentOut,
)
def admin_update_payment(
    payment_id: int,
    payload: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):
    return update_admin_payment(
        db,
        payment_id,
        payload,
    )

from app.schemas.audit import AuditLogOut
from app.services.audit_service import list_audit_logs
@router.get(
    "/audit-logs",
    response_model=list[AuditLogOut],
)
def admin_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):
    return list_audit_logs(
        db,
        limit,
    )

from app.schemas.analytics import (
    AdminOverviewOut,
    CentrePerformanceOut,
    DailyTrendOut,
)

from app.services.analytics_service import (
    admin_overview,
    centre_performance,
    daily_trend,
)

@router.get(
    "/analytics/overview",
    response_model=AdminOverviewOut,
)
def admin_analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):
    return admin_overview(db)


@router.get(
    "/analytics/centres",
    response_model=list[CentrePerformanceOut],
)
def admin_centre_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):
    return centre_performance(db)


@router.get(
    "/analytics/trend",
    response_model=list[DailyTrendOut],
)
def admin_daily_trend(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):
    return daily_trend(
        db,
        days,
    )