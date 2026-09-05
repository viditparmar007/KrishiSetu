from pydantic import BaseModel, Field


class SimulationInput(BaseModel):
    scenario_name: str = Field(
        default="Scenario",
        min_length=1,
        max_length=100,
    )
    expected_farmers: int = Field(ge=1, le=10000)
    counters: int = Field(ge=1, le=100)
    average_processing_minutes: float = Field(gt=0, le=240)
    working_hours: float = Field(gt=0, le=24)


class SimulationTimelinePoint(BaseModel):
    minute: float
    arrived: int
    waiting: int
    in_service: int
    completed: int


class SimulationResult(BaseModel):
    scenario_name: str
    expected_farmers: int
    counters: int
    average_processing_minutes: float
    working_hours: float

    arrival_rate_per_hour: float
    service_capacity_per_hour: float
    theoretical_shift_capacity: int
    workload_percent: float
    utilization_percent: float

    average_wait_minutes: float
    maximum_wait_minutes: float
    maximum_queue: int
    throughput_per_hour: float

    completed_within_working_hours: int
    remaining_at_closing: int
    expected_completion_minutes: float
    expected_completion_hours: float
    overtime_minutes: float

    status: str
    recommendation: str
    disclaimer: str
    timeline: list[SimulationTimelinePoint]


class ScenarioComparisonRequest(BaseModel):
    scenarios: list[SimulationInput] = Field(min_length=2, max_length=10)


class ScenarioComparisonOut(BaseModel):
    scenarios: list[SimulationResult]
    recommended_scenario_name: str
    explanation: str
