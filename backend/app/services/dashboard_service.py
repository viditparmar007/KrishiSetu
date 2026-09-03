from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.models.crop import Crop
from app.models.enums import CropStatus
from app.models.farm import Farm
from app.models.user import User
from app.services.farmer_service import get_farmer_for_user


def crop_item(crop: Crop, farm_name: str) -> dict:
    return {
        "id": crop.id,
        "farm_id": crop.farm_id,
        "farm_name": farm_name,
        "crop_name": crop.crop_name,
        "status": crop.status,
        "expected_harvest_date": crop.expected_harvest_date,
        "expected_quantity": crop.expected_quantity,
        "quantity_unit": crop.quantity_unit,
    }


def build_farmer_dashboard(db: Session, current_user: User) -> dict:
    farmer = get_farmer_for_user(db, current_user)

    farms = db.query(Farm).filter(Farm.farmer_id == farmer.id).all()
    farm_ids = [farm.id for farm in farms]

    crops: list[Crop] = []
    if farm_ids:
        crops = (
            db.query(Crop)
            .filter(Crop.farm_id.in_(farm_ids))
            .order_by(Crop.id.desc())
            .all()
        )

    names = {farm.id: farm.farm_name for farm in farms}

    growing = [c for c in crops if c.status == CropStatus.GROWING]
    ready = [c for c in crops if c.status == CropStatus.HARVEST_READY]
    active = [
        c for c in crops
        if c.status in {CropStatus.GROWING, CropStatus.HARVEST_READY}
    ]

    today = date.today()
    limit = today + timedelta(days=30)
    upcoming = [
        c for c in crops
        if c.expected_harvest_date is not None
        and today <= c.expected_harvest_date <= limit
    ]

    return {
        "farmer_name": farmer.name,
        "total_farms": len(farms),
        "total_crops": len(crops),
        "growing_crops": len(growing),
        "harvest_ready_crops": len(ready),
        "active_crops": [crop_item(c, names[c.farm_id]) for c in active[:5]],
        "upcoming_harvests": [
            crop_item(c, names[c.farm_id]) for c in upcoming[:5]
        ],
    }