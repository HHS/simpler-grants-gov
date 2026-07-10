import pytest
from pydantic import ValidationError

from src.workflow.config.workflow_service_config import WorkflowServiceConfig


def test_workflow_service_config(workflow_user):
    config = WorkflowServiceConfig()
    assert config.workflow_service_internal_user_id == workflow_user.user_id


def test_workflow_service_config_missing_param(monkeypatch):
    monkeypatch.delenv("WORKFLOW_SERVICE_INTERNAL_USER_ID")

    with pytest.raises(ValidationError, match="Field required"):
        WorkflowServiceConfig()
