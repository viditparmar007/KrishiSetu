import heapq
import math

from app.schemas.simulator import SimulationInput


def _build_recommendation(
    workload_percent: float,
    average_wait_minutes: float,
    overtime_minutes: float,
    remaining_at_closing: int,
) -> tuple[str, str]:
    if remaining_at_closing > 0 or overtime_minutes > 0:
        return (
            "OVERLOADED",
            "Add counters, reduce processing time, extend working hours, "
            "or distribute arrivals across additional slots.",
        )

    if average_wait_minutes > 30:
        return (
            "HIGH_WAIT",
            "Capacity finishes within the shift, but waiting is high. "
            "Consider another counter or better slot distribution.",
        )

    if workload_percent < 50:
        return (
            "UNDERUTILIZED",
            "The scenario has substantial spare capacity. Review whether "
            "all counters need to remain open for the full shift.",
        )

    return (
        "BALANCED",
        "The simulated demand and capacity are reasonably balanced.",
    )


def _timeline_points(
    arrival_times: list[float],
    start_times: list[float],
    finish_times: list[float],
    working_minutes: float,
    completion_minutes: float,
) -> list[dict]:
    sample_minutes = {0.0, round(working_minutes, 2)}

    hour = 60.0
    while hour < max(working_minutes, completion_minutes):
        sample_minutes.add(round(hour, 2))
        hour += 60.0

    sample_minutes.add(round(completion_minutes, 2))
    points = []

    for minute in sorted(sample_minutes):
        arrived = sum(value <= minute for value in arrival_times)
        completed = sum(value <= minute for value in finish_times)
        in_service = sum(
            start <= minute < finish
            for start, finish in zip(start_times, finish_times)
        )
        waiting = max(0, arrived - completed - in_service)

        points.append(
            {
                "minute": round(minute, 2),
                "arrived": arrived,
                "waiting": waiting,
                "in_service": in_service,
                "completed": completed,
            }
        )

    return points


def run_simulation(payload: SimulationInput) -> dict:
    farmers = payload.expected_farmers
    counters = payload.counters
    processing_minutes = payload.average_processing_minutes
    working_minutes = payload.working_hours * 60.0

    arrival_window_minutes = max(
    0.0,
    working_minutes - processing_minutes,
)

    arrival_interval = arrival_window_minutes / farmers
    arrival_times = [
        index * arrival_interval
        for index in range(farmers)
    ]

    counter_available_at = [0.0 for _ in range(counters)]
    heapq.heapify(counter_available_at)

    start_times: list[float] = []
    finish_times: list[float] = []
    waits: list[float] = []
    waiting_start_times: list[float] = []
    maximum_queue = 0

    for arrival_time in arrival_times:
        next_available = heapq.heappop(counter_available_at)
        start_time = max(arrival_time, next_available)
        finish_time = start_time + processing_minutes
        wait_time = start_time - arrival_time

        heapq.heappush(counter_available_at, finish_time)

        start_times.append(start_time)
        finish_times.append(finish_time)
        waits.append(wait_time)

        waiting_start_times = [
            value
            for value in waiting_start_times
            if value > arrival_time
        ]

        if start_time > arrival_time:
            waiting_start_times.append(start_time)

        maximum_queue = max(
            maximum_queue,
            len(waiting_start_times),
        )

    completion_minutes = max(finish_times)
    completion_hours = completion_minutes / 60.0
    overtime_minutes = max(
        0.0,
        completion_minutes - working_minutes,
    )

    completed_within_shift = sum(
        finish_time <= working_minutes
        for finish_time in finish_times
    )
    remaining_at_closing = farmers - completed_within_shift

    arrival_rate = farmers / payload.working_hours
    service_capacity_per_hour = (
        counters * (60.0 / processing_minutes)
    )
    theoretical_shift_capacity = math.floor(
        service_capacity_per_hour * payload.working_hours
    )

    workload_percent = (
        farmers / theoretical_shift_capacity * 100.0
        if theoretical_shift_capacity > 0
        else 0.0
    )

    utilization_percent = (
        farmers * processing_minutes
        / (counters * completion_minutes)
        * 100.0
    )

    throughput_per_hour = farmers / completion_hours
    average_wait = sum(waits) / farmers
    maximum_wait = max(waits)

    status, recommendation = _build_recommendation(
        workload_percent=workload_percent,
        average_wait_minutes=average_wait,
        overtime_minutes=overtime_minutes,
        remaining_at_closing=remaining_at_closing,
    )

    return {
        "scenario_name": payload.scenario_name,
        "expected_farmers": farmers,
        "counters": counters,
        "average_processing_minutes": processing_minutes,
        "working_hours": payload.working_hours,

        "arrival_rate_per_hour": round(arrival_rate, 2),
        "service_capacity_per_hour": round(
            service_capacity_per_hour,
            2,
        ),
        "theoretical_shift_capacity": theoretical_shift_capacity,
        "workload_percent": round(workload_percent, 2),
        "utilization_percent": round(utilization_percent, 2),

        "average_wait_minutes": round(average_wait, 2),
        "maximum_wait_minutes": round(maximum_wait, 2),
        "maximum_queue": maximum_queue,
        "throughput_per_hour": round(throughput_per_hour, 2),

        "completed_within_working_hours": completed_within_shift,
        "remaining_at_closing": remaining_at_closing,
        "expected_completion_minutes": round(
            completion_minutes,
            2,
        ),
        "expected_completion_hours": round(
            completion_hours,
            2,
        ),
        "overtime_minutes": round(overtime_minutes, 2),

        "status": status,
        "recommendation": recommendation,
        "disclaimer": (
            "What-if estimate based on even arrivals and constant "
            "processing time. Actual queues may differ."
        ),
        "timeline": _timeline_points(
            arrival_times=arrival_times,
            start_times=start_times,
            finish_times=finish_times,
            working_minutes=working_minutes,
            completion_minutes=completion_minutes,
        ),
    }


def compare_simulations(
    scenarios: list[SimulationInput],
) -> dict:
    results = [
        run_simulation(item)
        for item in scenarios
    ]

    recommended = min(
        results,
        key=lambda item: (
            item["overtime_minutes"] > 0,
            item["overtime_minutes"],
            item["average_wait_minutes"],
            item["counters"],
        ),
    )

    return {
        "scenarios": results,
        "recommended_scenario_name": (
            recommended["scenario_name"]
        ),
        "explanation": (
            "Recommendation prioritizes finishing within working "
            "hours, then lower waiting, then fewer counters. "
            "It is a planning aid, not an automatic decision."
        ),
    }
