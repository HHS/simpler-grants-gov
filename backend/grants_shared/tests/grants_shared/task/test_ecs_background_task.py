import logging
import sys
import time

import pytest
from flask import Flask

from grants_shared.api.maintenance_mode import MaintenanceModeLogEvent, get_maintenance_mode_config
from grants_shared.logs.flask_logger import add_extra_data_to_global_logs, init_app
from grants_shared.task.ecs_background_task import ecs_background_task


@pytest.fixture(autouse=True)
def clear_maintenance_config_cache():
    # The maintenance-mode config is @cache'd, so clear it before every test to
    # keep the ENABLE_MAINTENANCE_MODE env var from leaking across tests.
    get_maintenance_mode_config.cache_clear()


@pytest.fixture
def logger():
    logger = logging.getLogger("grants_shared")
    before_level = logger.level

    logger.setLevel(logging.DEBUG)
    handler = logging.StreamHandler(sys.stdout)
    logger.addHandler(handler)
    yield logger
    logger.setLevel(before_level)
    logger.removeHandler(handler)


@pytest.fixture
def app(logger):
    flask_app = Flask("test_app_name")
    init_app(logger, flask_app, "test")
    return flask_app


def test_ecs_background_task(app, caplog, monkeypatch_session):
    monkeypatch_session.setenv(
        "LOG_LEVEL_OVERRIDES",
        "newrelic.core.agent=ERROR,newrelic.core.agent_protocol=ERROR,grants_shared.adapters.newrelic=ERROR",
    )

    # We pull in the app so its initialized
    # Global logging params like the task name are stored on the app
    caplog.set_level(logging.INFO)

    @ecs_background_task(task_name="my_test_task_name")
    def my_test_func(param1, param2):
        # Add a brief sleep so that we can test the duration logic
        time.sleep(0.05)  # 0.05s
        add_extra_data_to_global_logs({"example_param": 12345})

        return param1 + param2

    # Verify the function works uneventfully
    assert my_test_func(1, 2) == 3

    # Filter out newrelic-related logs
    relevant_records = [
        record for record in caplog.records if "newrelic" not in record.name.lower()
    ]
    for record in relevant_records:
        extra = record.__dict__
        assert extra["task_name"] == "my_test_task_name"

    last_record = relevant_records[-1].__dict__
    # Make sure the ECS task duration was tracked
    allowed_error = 0.03
    assert last_record["ecs_task_duration_sec"] == pytest.approx(0.05, abs=allowed_error)
    # Make sure the extra we added was put in this automatically
    assert last_record["example_param"] == 12345
    assert last_record["message"] == "Completed ECS task my_test_task_name"


def test_ecs_background_task_when_erroring(app, caplog, monkeypatch_session):
    monkeypatch_session.setenv(
        "LOG_LEVEL_OVERRIDES",
        "newrelic.core.agent=ERROR,newrelic.core.agent_protocol=ERROR,grants_shared.adapters.newrelic=ERROR",
    )

    caplog.set_level(logging.INFO)

    @ecs_background_task(task_name="my_error_test_task_name")
    def my_test_error_func():
        add_extra_data_to_global_logs({"another_param": "hello"})

        raise ValueError("I am an error")

    with pytest.raises(ValueError, match="I am an error"):
        my_test_error_func()

    # Filter out newrelic-related logs
    relevant_records = [
        record for record in caplog.records if "newrelic" not in record.name.lower()
    ]
    for record in relevant_records:
        extra = record.__dict__
        assert extra["task_name"] == "my_error_test_task_name"

    last_record = relevant_records[-1].__dict__

    assert last_record["another_param"] == "hello"
    assert last_record["levelname"] == "ERROR"
    assert last_record["message"] == "ECS task failed"
    assert last_record["exc_info_short"] == "ValueError('I am an error')"


def test_ecs_background_task_skipped_during_maintenance_mode(app, caplog, monkeypatch):
    caplog.set_level(logging.INFO)
    monkeypatch.setenv("ENABLE_MAINTENANCE_MODE", "true")
    get_maintenance_mode_config.cache_clear()

    was_called = False

    @ecs_background_task(task_name="my_maintenance_task")
    def my_test_func():
        nonlocal was_called
        was_called = True
        return "ran"

    # The task exits cleanly without running its wrapped (DB-touching) body.
    assert my_test_func() is None
    assert was_called is False

    skip_records = [
        record
        for record in caplog.records
        if getattr(record, "maintenance_mode_event", None) == MaintenanceModeLogEvent.TASK_SKIPPED
    ]
    assert len(skip_records) == 1
    assert skip_records[0].message == "Skipping ECS task due to maintenance mode"
    assert skip_records[0].task_name == "my_maintenance_task"


def test_ecs_background_task_runs_normally_when_maintenance_mode_off(app, caplog, monkeypatch):
    caplog.set_level(logging.INFO)
    monkeypatch.setenv("ENABLE_MAINTENANCE_MODE", "false")
    get_maintenance_mode_config.cache_clear()

    @ecs_background_task(task_name="my_non_maintenance_task")
    def my_test_func(param1, param2):
        return param1 + param2

    # With maintenance off, the wrapped function runs and its return value is preserved.
    assert my_test_func(2, 3) == 5

    skip_records = [
        record
        for record in caplog.records
        if getattr(record, "maintenance_mode_event", None) == MaintenanceModeLogEvent.TASK_SKIPPED
    ]
    assert len(skip_records) == 0
