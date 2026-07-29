import uuid

import pytest
from sqlalchemy import select

from src.constants.lookup_constants import AwardRecommendationStatus, Privilege, WorkflowType
from src.db.models.workflow_models import Workflow
from src.workflow.manager.workflow_manager import WorkflowManager
from tests.lib.agency_test_utils import create_user_in_agency_with_jwt_and_api_key
from tests.src.db.models.factories import AwardRecommendationFactory, OpportunityFactory


@pytest.fixture
def award_recommendation_auth_data(
    db_session,
    enable_factory_create,
):
    """Create a user who can view and submit award recommendations."""
    user, agency, token, api_key_id = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[
            Privilege.VIEW_AWARD_RECOMMENDATION,
            Privilege.SUBMIT_AWARD_RECOMMENDATION,
        ],
    )

    return user, agency, token, api_key_id


@pytest.fixture
def draft_award_recommendation(
    award_recommendation_auth_data,
    enable_factory_create,
):
    """Create a draft award recommendation for the user's agency."""
    _, agency, _, _ = award_recommendation_auth_data

    opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code,
    )

    return AwardRecommendationFactory.create(
        opportunity=opportunity,
        award_recommendation_status=AwardRecommendationStatus.DRAFT,
        review_workflow=None,
        review_workflow_id=None,
    )


def test_award_recommendation_start_review_success(
    client,
    app,
    award_recommendation_auth_data,
    draft_award_recommendation,
    db_session,
    workflow_sqs_queue,
    workflow_user,
    workflow_client_registry,
):
    """Test successfully starting an award recommendation review."""
    _, _, token, _ = award_recommendation_auth_data

    response = client.post(
        (
            "/alpha/award-recommendations/"
            f"{draft_award_recommendation.award_recommendation_id}/start-review"
        ),
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200

    response_json = response.get_json()
    assert response_json["message"] == "Success"

    # The queued workflow has not been processed yet.
    assert (
        response_json["data"]["award_recommendation_status"]
        == AwardRecommendationStatus.DRAFT.value
    )
    assert response_json["data"]["review_workflow_id"] is None

    # Process the workflow start event.
    with app.app_context():
        messages_to_delete, messages_to_keep = WorkflowManager().process_batch()

        assert len(messages_to_delete) == 1
        assert len(messages_to_keep) == 0

    db_session.refresh(draft_award_recommendation)

    assert (
        draft_award_recommendation.award_recommendation_status
        == AwardRecommendationStatus.SUBMITTED
    )
    assert draft_award_recommendation.review_workflow_id is not None

    workflow = db_session.execute(
        select(Workflow).where(
            Workflow.award_recommendation_id == draft_award_recommendation.award_recommendation_id
        )
    ).scalar_one_or_none()

    assert workflow is not None
    assert workflow.workflow_type == (WorkflowType.AWARD_RECOMMENDATION_REVIEW)
    assert workflow.award_recommendation_id == (draft_award_recommendation.award_recommendation_id)
    assert draft_award_recommendation.review_workflow_id == (workflow.workflow_id)


def test_award_recommendation_start_review_not_draft(
    client,
    award_recommendation_auth_data,
    enable_factory_create,
):
    """Test starting review for a non-draft award recommendation."""
    _, agency, token, _ = award_recommendation_auth_data

    opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code,
    )

    award_recommendation = AwardRecommendationFactory.create(
        opportunity=opportunity,
        award_recommendation_status=AwardRecommendationStatus.SUBMITTED,
        review_workflow=None,
        review_workflow_id=None,
    )

    response = client.post(
        (
            "/alpha/award-recommendations/"
            f"{award_recommendation.award_recommendation_id}/start-review"
        ),
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 422

    response_json = response.get_json()
    assert response_json["message"] == ("Award recommendation is not in Draft status")


def test_award_recommendation_start_review_existing_workflow(
    client,
    award_recommendation_auth_data,
    enable_factory_create,
):
    """Test starting review when a review workflow already exists."""
    _, agency, token, _ = award_recommendation_auth_data

    opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code,
    )

    award_recommendation = AwardRecommendationFactory.create(
        opportunity=opportunity,
        award_recommendation_status=AwardRecommendationStatus.DRAFT,
    )

    # AwardRecommendationFactory currently creates a workflow by default.
    assert award_recommendation.review_workflow_id is not None

    response = client.post(
        (
            "/alpha/award-recommendations/"
            f"{award_recommendation.award_recommendation_id}/start-review"
        ),
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 422

    response_json = response.get_json()
    assert response_json["message"] == (
        "Award recommendation review process has already been started"
    )


def test_award_recommendation_start_review_no_permission(
    client,
    db_session,
    enable_factory_create,
):
    """Test starting review without the required privilege."""
    user, agency, token, _ = create_user_in_agency_with_jwt_and_api_key(
        db_session=db_session,
        privileges=[
            Privilege.VIEW_AWARD_RECOMMENDATION,
        ],
    )

    opportunity = OpportunityFactory.create(
        agency_code=agency.agency_code,
    )

    award_recommendation = AwardRecommendationFactory.create(
        opportunity=opportunity,
        award_recommendation_status=AwardRecommendationStatus.DRAFT,
        review_workflow=None,
        review_workflow_id=None,
    )

    response = client.post(
        (
            "/alpha/award-recommendations/"
            f"{award_recommendation.award_recommendation_id}/start-review"
        ),
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 403

    response_json = response.get_json()
    assert response_json["message"] == "Forbidden"


def test_award_recommendation_start_review_not_found(
    client,
    award_recommendation_auth_data,
):
    """Test starting review for an award recommendation that does not exist."""
    _, _, token, _ = award_recommendation_auth_data

    award_recommendation_id = uuid.uuid4()

    response = client.post(
        ("/alpha/award-recommendations/" f"{award_recommendation_id}/start-review"),
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 404

    response_json = response.get_json()
    assert response_json["message"] == (
        "Could not find Award Recommendation with ID " f"{award_recommendation_id}"
    )
