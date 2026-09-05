from app.schemas.simulator import SimulationInput
from app.services.simulator_service import (
    compare_simulations,
    run_simulation,
)


def test_balanced_finishes_without_overtime():
    payload = SimulationInput(
        scenario_name="Balanced",
        expected_farmers=100,
        counters=3,
        average_processing_minutes=8,
        working_hours=8,
    )

    result = run_simulation(payload)

    assert result["overtime_minutes"] == 0
    assert result["remaining_at_closing"] == 0
    assert result["status"] in {
        "BALANCED",
        "UNDERUTILIZED",
    }


def test_overload_has_overtime():
    payload = SimulationInput(
        scenario_name="Overload",
        expected_farmers=500,
        counters=2,
        average_processing_minutes=10,
        working_hours=8,
    )

    result = run_simulation(payload)

    assert result["status"] == "OVERLOADED"
    assert result["overtime_minutes"] > 0
    assert result["maximum_queue"] > 0


def test_more_counters_do_not_increase_wait():
    two = SimulationInput(
        scenario_name="Two",
        expected_farmers=220,
        counters=2,
        average_processing_minutes=8,
        working_hours=8,
    )
    four = SimulationInput(
        scenario_name="Four",
        expected_farmers=220,
        counters=4,
        average_processing_minutes=8,
        working_hours=8,
    )

    result_two = run_simulation(two)
    result_four = run_simulation(four)

    assert (
        result_four["average_wait_minutes"]
        <= result_two["average_wait_minutes"]
    )
    assert (
        result_four["overtime_minutes"]
        <= result_two["overtime_minutes"]
    )


def test_same_input_is_deterministic():
    payload = SimulationInput(
        scenario_name="Repeat",
        expected_farmers=150,
        counters=3,
        average_processing_minutes=7,
        working_hours=8,
    )

    assert run_simulation(payload) == run_simulation(payload)


def test_compare_returns_recommendation():
    scenarios = [
        SimulationInput(
            scenario_name="Two counters",
            expected_farmers=200,
            counters=2,
            average_processing_minutes=8,
            working_hours=8,
        ),
        SimulationInput(
            scenario_name="Four counters",
            expected_farmers=200,
            counters=4,
            average_processing_minutes=8,
            working_hours=8,
        ),
    ]

    result = compare_simulations(scenarios)

    assert len(result["scenarios"]) == 2
    assert result["recommended_scenario_name"]