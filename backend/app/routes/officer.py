from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_role

from app.models.user import User

from app.schemas.centre import CentreOut
from app.schemas.officer import OfficerOut

from app.schemas.slot import (
    SlotCreate,
    SlotOut,
    SlotUpdate,
)

from app.services.centre_service import (
    get_centre_or_404,
)

from app.services.officer_service import (
    get_officer_for_user,
)

from app.services.slot_service import (
    create_slot_for_centre,
    update_slot,
)
from datetime import date

from fastapi import Query

from app.models.enums import BookingStatus
from app.schemas.booking import BookingOut

from app.services.booking_service import (
    list_officer_centre_bookings,
)
from datetime import date
from fastapi import Query
from app.schemas.queue import CentreQueueStatusOut, OfficerQueueItemOut, QueueEntryOut
from app.services.queue_service import (
    call_next_farmer,
    complete_queue_entry,
    get_centre_queue_status,
    get_officer_queue,
    mark_queue_no_show,
    start_processing,
)
from app.schemas.procurement import (
    DocumentVerificationUpdate,
    ProcurementDecisionUpdate,
    ProcurementOut,
    QualityCheckUpdate,
    WeighingUpdate,
)

from app.services.procurement_service import (
    decide_procurement,
    list_officer_procurements,
    quality_check,
    record_weighing,
    start_procurement,
    verify_documents,
)
from app.schemas.payment import (
    PaymentOut,
    PaymentUpdate,
)

from app.services.payment_service import (
    list_officer_payments,
    update_officer_payment,
)
router = APIRouter(
    prefix="/api/v1/officer",
    tags=["Officer"],
)


@router.get(
    "/me",
    response_model=OfficerOut,
)
def officer_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("OFFICER")
    ),
):

    return get_officer_for_user(
        db,
        current_user,
    )


@router.get(
    "/centre",
    response_model=CentreOut,
)
def officer_centre(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("OFFICER")
    ),
):

    officer = get_officer_for_user(
        db,
        current_user,
    )

    return get_centre_or_404(
        db,
        officer.centre_id,
        include_inactive=True,
    )


@router.post(
    "/slots",
    response_model=SlotOut,
    status_code=status.HTTP_201_CREATED,
)
def create_officer_slot(
    payload: SlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("OFFICER")
    ),
):

    officer = get_officer_for_user(
        db,
        current_user,
    )

    return create_slot_for_centre(
        db,
        officer.centre_id,
        payload,
    )


@router.put(
    "/slots/{slot_id}",
    response_model=SlotOut,
)
def officer_update_slot(
    slot_id: int,
    payload: SlotUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("OFFICER")
    ),
):

    officer = get_officer_for_user(
        db,
        current_user,
    )

    slot = update_slot(
        db,
        slot_id,
        payload,
    )

    if slot.centre_id != officer.centre_id:
        raise HTTPException(
            status_code=404,
            detail="Slot not found",
        )

    return slot

@router.get(
    "/bookings",
    response_model=list[BookingOut],
)
def officer_bookings(
    booking_date: date | None = Query(
        default=None
    ),

    booking_status: BookingStatus | None = Query(
        default=None
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_role("OFFICER")
    ),
):
    return list_officer_centre_bookings(
        db,
        current_user,
        booking_date,
        booking_status,
   )

@router.get("/queue", response_model=list[OfficerQueueItemOut])
def officer_queue(
    queue_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("OFFICER")),
):
    return get_officer_queue(db, current_user, queue_date or date.today())


@router.get("/queue/summary", response_model=CentreQueueStatusOut)
def officer_queue_summary(
    queue_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("OFFICER")),
):
    from app.services.officer_service import get_officer_for_user
    officer = get_officer_for_user(db, current_user)
    return get_centre_queue_status(db, officer.centre_id, queue_date or date.today())


@router.post("/queue/call-next", response_model=QueueEntryOut)
def officer_call_next(
    queue_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("OFFICER")),
):
    return call_next_farmer(db, current_user, queue_date or date.today())


@router.post("/queue/{queue_entry_id}/start-processing", response_model=QueueEntryOut)
def officer_start_processing(
    queue_entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("OFFICER")),
):
    return start_processing(db, current_user, queue_entry_id)


@router.post("/queue/{queue_entry_id}/complete", response_model=QueueEntryOut)
def officer_complete_queue(
    queue_entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("OFFICER")),
):
    return complete_queue_entry(db, current_user, queue_entry_id)


@router.post("/queue/{queue_entry_id}/no-show", response_model=QueueEntryOut)
def officer_no_show(
    queue_entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("OFFICER")),
):
    return mark_queue_no_show(db, current_user, queue_entry_id)

@router.get(
    "/procurements",
    response_model=list[ProcurementOut],
)
def officer_procurements(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("OFFICER")
    ),
):
    return list_officer_procurements(
        db,
        current_user,
    )


@router.post(
    "/procurements/start/{booking_id}",
    response_model=ProcurementOut,
)
def officer_start_procurement(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("OFFICER")
    ),
):
    return start_procurement(
        db,
        current_user,
        booking_id,
    )


@router.post(
    "/procurements/{procurement_id}/documents",
    response_model=ProcurementOut,
)
def officer_verify_documents(
    procurement_id: int,
    payload: DocumentVerificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("OFFICER")
    ),
):
    return verify_documents(
        db,
        current_user,
        procurement_id,
        payload,
    )


@router.post(
    "/procurements/{procurement_id}/quality",
    response_model=ProcurementOut,
)
def officer_quality_check(
    procurement_id: int,
    payload: QualityCheckUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("OFFICER")
    ),
):
    return quality_check(
        db,
        current_user,
        procurement_id,
        payload,
    )


@router.post(
    "/procurements/{procurement_id}/weighing",
    response_model=ProcurementOut,
)
def officer_weighing(
    procurement_id: int,
    payload: WeighingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("OFFICER")
    ),
):
    return record_weighing(
        db,
        current_user,
        procurement_id,
        payload,
    )


@router.post(
    "/procurements/{procurement_id}/decision",
    response_model=ProcurementOut,
)
def officer_decision(
    procurement_id: int,
    payload: ProcurementDecisionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("OFFICER")
    ),
):
    return decide_procurement(
        db,
        current_user,
        procurement_id,
        payload,
    )

@router.get(
    "/payments",
    response_model=list[PaymentOut],
)
def officer_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("OFFICER")
    ),
):
    return list_officer_payments(
        db,
        current_user,
    )


@router.put(
    "/payments/{payment_id}",
    response_model=PaymentOut,
)
def officer_update_payment(
    payment_id: int,
    payload: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("OFFICER")
    ),
):
    return update_officer_payment(
        db,
        current_user,
        payment_id,
        payload,
    )

from app.schemas.analytics import OfficerAnalyticsOut
from app.services.analytics_service import officer_analytics

@router.get(
    "/analytics/summary",
    response_model=OfficerAnalyticsOut,
)
def officer_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("OFFICER")
    ),
):
    return officer_analytics(
        db,
        current_user,
    )