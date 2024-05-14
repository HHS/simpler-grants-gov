import logging
import time

import pytest

from src.logging.flask_logger import add_extra_data_to_global_logs
from src.task.ecs_background_task import ecs_background_task


def test_ecs_background_task(app, caplog):
    # We pull in the app so its initialized
    # Global logging params like the task name are stored on the app
    caplog.set_level(logging.INFO)

    @ecs_background_task(task_name="my_test_task_name")
    def my_test_func(param1, param2):
        # Add a brief sleep so that we can test the duration logic
        time.sleep(0.2)  # 0.2s
        add_extra_data_to_global_logs({"example_param": 12345})

        return param1 + param2

    # Verify the function works uneventfully
    assert my_test_func(1, 2) == 3

    for record in caplog.records:
        extra = record.__dict__
        assert extra["task_name"] == "my_test_task_name"

    last_record = caplog.records[-1].__dict__
    # Make sure the ECS task duration was tracked
    allowed_error = 0.1
    assert last_record["ecs_task_duration_sec"] == pytest.approx(0.2, abs=allowed_error)
    # Make sure the extra we added was put in this automatically
    assert last_record["example_param"] == 12345
    assert last_record["message"] == "Completed ECS task my_test_task_name"


def test_ecs_background_task_when_erroring(app, caplog):
    caplog.set_level(logging.INFO)

    @ecs_background_task(task_name="my_error_test_task_name")
    def my_test_error_func():
        add_extra_data_to_global_logs({"another_param": "hello"})

        raise ValueError("I am an error")

    with pytest.raises(ValueError, match="I am an error"):
        my_test_error_func()

    for record in caplog.records:
        extra = record.__dict__
        assert extra["task_name"] == "my_error_test_task_name"

    last_record = caplog.records[-1].__dict__

    assert last_record["another_param"] == "hello"
    assert last_record["levelname"] == "ERROR"
    assert last_record["message"] == "ECS task failed"
