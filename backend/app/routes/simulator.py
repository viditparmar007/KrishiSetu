
from fastapi import APIRouter, Depends

from app.dependencies import require_role
from app.models.user import User
from app.schemas.simulator import (
    ScenarioComparisonOut,
    ScenarioComparisonRequest,
    SimulationInput,
    SimulationResult,
)
from app.services.simulator_service import (
    compare_simulations,
    run_simulation,
)


router = APIRouter(
    prefix="/api/v1/admin/simulator",
    tags=["Admin Simulator"],
)


@router.post("/run", response_model=SimulationResult)
def simulate_procurement(
    payload: SimulationInput,
    current_user: User = Depends(require_role("ADMIN")),
):
    return run_simulation(payload)


@router.post(
    "/compare",
    response_model=ScenarioComparisonOut,
)
def compare_procurement_scenarios(
    payload: ScenarioComparisonRequest,
    current_user: User = Depends(require_role("ADMIN")),
):
    return compare_simulations(payload.scenarios)

