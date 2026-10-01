import uuid

import pytest
from sqlalchemy import select

from src.constants.lookup_constants import AwardRecommendationStatus, Privilege, WorkflowType
from src.db.models.workflow_models import Workflow
from src.workflow.manager.workflow_manager import WorkflowManager
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt_and_api_key
from tests.src.db.models.factories import (
    AwardRecommendationFactory,
    OpportunityFactory,
    WorkflowFactory,
)

API_URL = "/alpha/award-recommendations"


@pytest.fixture
def award_recommendation_auth_data(
    db_session,
    enable_factory_create,
):
    """Create a user authorized to submit award recommendations."""
    user, agency, token, api_key_id = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[
            Privilege.VIEW_AWARD_RECOMMENDATION,
            Privilege.SUBMIT_AWARD_RECOMMENDATION,
        ],
    )

    return user, agency, token, api_key_id


@pytest.fixture
def existing_award_recommendation(
    award_recommendation_auth_data,
    enable_factory_create,
    db_session,
):
    """Create a draft award recommendation for the user's agency."""
    _, agency, _, _ = award_recommendation_auth_data

    opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code,
        is_draft=False,
        is_simpler_grants_opportunity=True,
    )

    award_recommendation = AwardRecommendationFactory.create(
        opportunity=opportunity,
        award_recommendation_status=AwardRecommendationStatus.DRAFT,
    )

    db_session.refresh(award_recommendation)

    assert award_recommendation.award_recommendation_status == AwardRecommendationStatus.DRAFT
    assert award_recommendation.review_workflow is None
    assert award_recommendation.review_workflow_id is None

    return award_recommendation


def test_award_recommendation_start_review_success(
    client,
    app,
    award_recommendation_auth_data,
    existing_award_recommendation,
    db_session,
    workflow_sqs_queue,
    workflow_user,
    workflow_client_registry,
):
    """Test successfully starting the award recommendation review."""
    _, _, token, _ = award_recommendation_auth_data

    response = client.post(
        (f"{API_URL}/" f"{existing_award_recommendation.award_recommendation_id}" "/start-review"),
        headers={"X-SGG-Token": token},
        json={
            "comment": "The award recommendation is ready for review.",
            "internal_comment": "Funding amounts have been confirmed.",
        },
    )

    response_json = response.get_json()

    assert response.status_code == 200, response_json
    assert response_json["message"] == "Success"

    # The workflow has only been queued, so the response should still show
    # the persisted state from before the workflow was processed.
    assert response_json["data"]["award_recommendation_status"] == AwardRecommendationStatus.DRAFT
    assert response_json["data"]["review_workflow_id"] is None

    # Process the queued workflow event.
    with app.app_context():
        messages_to_delete, messages_to_keep = WorkflowManager().process_batch()

        assert len(messages_to_delete) == 1
        assert len(messages_to_keep) == 0

    # Refresh the award recommendation after the workflow processes.
    db_session.refresh(existing_award_recommendation)

    assert (
        existing_award_recommendation.award_recommendation_status
        == AwardRecommendationStatus.SUBMITTED
    )
    assert existing_award_recommendation.review_workflow is not None
    assert existing_award_recommendation.review_workflow_id is not None

    # Verify the Award Recommendation Review workflow was created.
    workflow = db_session.execute(
        select(Workflow).where(
            Workflow.award_recommendation_id
            == existing_award_recommendation.award_recommendation_id
        )
    ).scalar_one_or_none()

    assert workflow is not None
    assert workflow.workflow_type == WorkflowType.AWARD_RECOMMENDATION_REVIEW
    assert workflow.award_recommendation_id == existing_award_recommendation.award_recommendation_id
    assert existing_award_recommendation.review_workflow == workflow
    assert existing_award_recommendation.review_workflow_id == workflow.workflow_id


def test_award_recommendation_start_review_without_internal_comment(
    client,
    app,
    award_recommendation_auth_data,
    existing_award_recommendation,
    db_session,
    workflow_sqs_queue,
    workflow_user,
    workflow_client_registry,
):
    """Test starting review without the optional internal comment."""
    _, _, token, _ = award_recommendation_auth_data

    response = client.post(
        (f"{API_URL}/" f"{existing_award_recommendation.award_recommendation_id}" "/start-review"),
        headers={"X-SGG-Token": token},
        json={
            "comment": "The award recommendation is ready for review.",
        },
    )

    response_json = response.get_json()

    assert response.status_code == 200, response_json
    assert response_json["message"] == "Success"

    with app.app_context():
        messages_to_delete, messages_to_keep = WorkflowManager().process_batch()

        assert len(messages_to_delete) == 1
        assert len(messages_to_keep) == 0

    db_session.refresh(existing_award_recommendation)

    assert (
        existing_award_recommendation.award_recommendation_status
        == AwardRecommendationStatus.SUBMITTED
    )
    assert existing_award_recommendation.review_workflow is not None
    assert existing_award_recommendation.review_workflow_id is not None


def test_award_recommendation_start_review_missing_comment(
    client,
    award_recommendation_auth_data,
    existing_award_recommendation,
):
    """Test that the public comment is required."""
    _, _, token, _ = award_recommendation_auth_data

    response = client.post(
        (f"{API_URL}/" f"{existing_award_recommendation.award_recommendation_id}" "/start-review"),
        headers={"X-SGG-Token": token},
        json={
            "internal_comment": "This should not be sufficient by itself.",
        },
    )

    response_json = response.get_json()

    assert response.status_code == 422
    assert any(
        error["field"] == "comment" and "Missing data for required field" in error["message"]
        for error in response_json["errors"]
    )


def test_award_recommendation_start_review_not_draft(
    client,
    award_recommendation_auth_data,
    enable_factory_create,
):
    """Test starting review for an award recommendation not in Draft."""
    _, agency, token, _ = award_recommendation_auth_data

    opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code,
        is_draft=False,
        is_simpler_grants_opportunity=True,
    )

    award_recommendation = AwardRecommendationFactory.create(
        opportunity=opportunity,
        award_recommendation_status=AwardRecommendationStatus.SUBMITTED,
    )

    response = client.post(
        (f"{API_URL}/" f"{award_recommendation.award_recommendation_id}" "/start-review"),
        headers={"X-SGG-Token": token},
        json={
            "comment": "Ready for review.",
        },
    )

    response_json = response.get_json()

    assert response.status_code == 422, response_json
    assert response_json["message"] == "Award recommendation is not in Draft status"


def test_award_recommendation_start_review_already_started(
    client,
    award_recommendation_auth_data,
    enable_factory_create,
    db_session,
):
    """Test starting review when a workflow already exists."""
    _, agency, token, _ = award_recommendation_auth_data

    opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code,
        is_draft=False,
        is_simpler_grants_opportunity=True,
    )

    award_recommendation = AwardRecommendationFactory.create(
        opportunity=opportunity,
        award_recommendation_status=AwardRecommendationStatus.DRAFT,
    )

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.AWARD_RECOMMENDATION_REVIEW,
        award_recommendation=award_recommendation,
        opportunity=None,
    )

    db_session.refresh(award_recommendation)

    assert award_recommendation.review_workflow == workflow
    assert award_recommendation.review_workflow_id == workflow.workflow_id

    response = client.post(
        (f"{API_URL}/" f"{award_recommendation.award_recommendation_id}" "/start-review"),
        headers={"X-SGG-Token": token},
        json={
            "comment": "Ready for review.",
        },
    )

    response_json = response.get_json()

    assert response.status_code == 422, response_json
    assert response_json["message"] == (
        "Award recommendation review process has already been started"
    )


def test_award_recommendation_start_review_no_permission(
    client,
    db_session,
    enable_factory_create,
):
    """Test starting review without submit permission."""
    _, agency, token, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[
            Privilege.VIEW_AWARD_RECOMMENDATION,
        ],
    )

    opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code,
        is_draft=False,
        is_simpler_grants_opportunity=True,
    )

    award_recommendation = AwardRecommendationFactory.create(
        opportunity=opportunity,
        award_recommendation_status=AwardRecommendationStatus.DRAFT,
    )

    response = client.post(
        (f"{API_URL}/" f"{award_recommendation.award_recommendation_id}" "/start-review"),
        headers={"X-SGG-Token": token},
        json={
            "comment": "Ready for review.",
        },
    )

    response_json = response.get_json()

    assert response.status_code == 403, response_json
    assert response_json["message"] == "Forbidden"


def test_award_recommendation_start_review_different_agency(
    client,
    db_session,
    award_recommendation_auth_data,
    enable_factory_create,
):
    """Test starting review for another agency's award recommendation."""
    _, _, token, _ = award_recommendation_auth_data

    _, other_agency, _, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[
            Privilege.VIEW_AWARD_RECOMMENDATION,
            Privilege.SUBMIT_AWARD_RECOMMENDATION,
        ],
    )

    opportunity = OpportunityFactory.create(
        agency_code=other_agency.agency_code,
        is_draft=False,
        is_simpler_grants_opportunity=True,
    )

    award_recommendation = AwardRecommendationFactory.create(
        opportunity=opportunity,
        award_recommendation_status=AwardRecommendationStatus.DRAFT,
    )

    response = client.post(
        (f"{API_URL}/" f"{award_recommendation.award_recommendation_id}" "/start-review"),
        headers={"X-SGG-Token": token},
        json={
            "comment": "Ready for review.",
        },
    )

    response_json = response.get_json()

    assert response.status_code == 403, response_json
    assert response_json["message"] == "Forbidden"


def test_award_recommendation_start_review_not_found(
    client,
    award_recommendation_auth_data,
):
    """Test starting review for a nonexistent award recommendation."""
    _, _, token, _ = award_recommendation_auth_data

    award_recommendation_id = uuid.uuid4()

    response = client.post(
        (f"{API_URL}/" f"{award_recommendation_id}" "/start-review"),
        headers={"X-SGG-Token": token},
        json={
            "comment": "Ready for review.",
        },
    )

    response_json = response.get_json()

    assert response.status_code == 404, response_json
    assert response_json["message"] == (
        "Could not find Award Recommendation with ID " f"{award_recommendation_id}"
    )
