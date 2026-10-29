import pytest

from src.constants.lookup_constants import (
    ApprovalResponseType,
    ApprovalType,
    AwardRecommendationStatus,
    Privilege,
    WorkflowType,
)
from src.workflow.handler.event_handler import EventHandler
from src.workflow.service.approval_service import can_user_do_agency_approval
from src.workflow.state_machine.award_recommendation_review_state_machine import (
    AwardRecommendationReviewState,
    AwardRecommendationReviewStateMachine,
    award_recommendation_review_config,
)
from src.workflow.workflow_errors import InvalidEventError
from tests.lib.agency_test_utils import give_user_privilege_in_agency
from tests.src.db.models.factories import AwardRecommendationFactory, UserFactory, WorkflowFactory
from tests.src.workflow.workflow_test_util import (
    build_start_workflow_event,
    send_process_event,
    validate_approvals,
)


@pytest.fixture
def award_recommendation(opportunity):
    return AwardRecommendationFactory.create(
        opportunity=opportunity,
        award_recommendation_status=AwardRecommendationStatus.DRAFT,
        is_deleted=False,
    )


def create_reviewer(agency, privilege: Privilege):
    user = UserFactory.create()

    give_user_privilege_in_agency(
        user=user,
        agency=agency,
        privileges=[privilege],
    )

    return user


@pytest.fixture
def content_creator(agency):
    return create_reviewer(
        agency,
        Privilege.SUBMIT_AWARD_RECOMMENDATION,
    )


@pytest.fixture
def pqc_reviewer(agency):
    return create_reviewer(
        agency,
        Privilege.PQC_REVIEWER,
    )


@pytest.fixture
def gms_reviewer(agency):
    return create_reviewer(
        agency,
        Privilege.GMS_REVIEWER,
    )


@pytest.fixture
def fmo_reviewer(agency):
    return create_reviewer(
        agency,
        Privilege.FMO_REVIEWER,
    )


@pytest.fixture
def gmo_reviewer(agency):
    return create_reviewer(
        agency,
        Privilege.GMO_REVIEWER,
    )


@pytest.fixture
def final_award_rec_approver(agency):
    return create_reviewer(
        agency,
        Privilege.FINAL_AWARD_REC_APPROVER,
    )


def test_award_recommendation_review_state_machine_happy_path(
    db_session,
    agency,
    award_recommendation,
    content_creator,
    pqc_reviewer,
    gms_reviewer,
    fmo_reviewer,
    gmo_reviewer,
    final_award_rec_approver,
):
    """Happy path: verifies the workflow can move through all review states."""

    sqs_container = build_start_workflow_event(
        workflow_type=WorkflowType.AWARD_RECOMMENDATION_REVIEW,
        user=content_creator,
        entity=award_recommendation,
    )

    state_machine = EventHandler(db_session, sqs_container).process()

    assert state_machine.current_state_value == AwardRecommendationReviewState.PENDING_PQC_REVIEW
    assert (
        state_machine.award_recommendation.award_recommendation_status
        == AwardRecommendationStatus.SUBMITTED
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_pqc_approval",
        workflow_id=state_machine.workflow.workflow_id,
        user=pqc_reviewer,
        approval_response_type=ApprovalResponseType.APPROVED,
        expected_state=AwardRecommendationReviewState.PENDING_GMS_REVIEW_START,
    )

    # The award recommendation remains Submitted until GMS begins its review.
    assert (
        state_machine.award_recommendation.award_recommendation_status
        == AwardRecommendationStatus.SUBMITTED
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="start_gms_review",
        workflow_id=state_machine.workflow.workflow_id,
        user=gms_reviewer,
        expected_state=AwardRecommendationReviewState.PENDING_GMS_REVIEW,
    )

    assert (
        state_machine.award_recommendation.award_recommendation_status
        == AwardRecommendationStatus.IN_REVIEW
    )

    db_session.expire(
        state_machine.award_recommendation,
        ["review_workflow"],
    )

    assert (
        state_machine.award_recommendation.review_workflow_id == state_machine.workflow.workflow_id
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_gms_approval",
        workflow_id=state_machine.workflow.workflow_id,
        user=gms_reviewer,
        approval_response_type=ApprovalResponseType.APPROVED,
        expected_state=AwardRecommendationReviewState.PENDING_FMO_REVIEW,
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_fmo_approval",
        workflow_id=state_machine.workflow.workflow_id,
        user=fmo_reviewer,
        approval_response_type=ApprovalResponseType.APPROVED,
        expected_state=AwardRecommendationReviewState.PENDING_GMO_REVIEW,
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_gmo_approval",
        workflow_id=state_machine.workflow.workflow_id,
        user=gmo_reviewer,
        approval_response_type=ApprovalResponseType.APPROVED,
        expected_state=AwardRecommendationReviewState.PENDING_AGENCY_APPROVAL,
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_agency_approval",
        workflow_id=state_machine.workflow.workflow_id,
        user=final_award_rec_approver,
        approval_response_type=ApprovalResponseType.APPROVED,
        expected_state=(AwardRecommendationReviewState.PENDING_DEPARTMENTAL_APPROVAL),
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_departmental_approval",
        workflow_id=state_machine.workflow.workflow_id,
        user=final_award_rec_approver,
        approval_response_type=ApprovalResponseType.APPROVED,
        expected_state=(AwardRecommendationReviewState.PENDING_INTERAGENCY_APPROVAL),
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_interagency_approval",
        workflow_id=state_machine.workflow.workflow_id,
        user=final_award_rec_approver,
        approval_response_type=ApprovalResponseType.APPROVED,
        expected_state=(AwardRecommendationReviewState.PENDING_EXECUTIVE_APPROVAL),
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_executive_approval",
        workflow_id=state_machine.workflow.workflow_id,
        user=final_award_rec_approver,
        approval_response_type=ApprovalResponseType.APPROVED,
        expected_state=AwardRecommendationReviewState.END,
        expected_is_active=False,
    )

    assert (
        state_machine.award_recommendation.award_recommendation_status
        == AwardRecommendationStatus.APPROVED
    )

    validate_approvals(
        state_machine,
        [
            {
                "approving_user_id": pqc_reviewer.user_id,
                "approval_type": ApprovalType.PQC_APPROVAL,
                "is_still_valid": True,
                "approval_response_type": ApprovalResponseType.APPROVED,
            },
            {
                "approving_user_id": gms_reviewer.user_id,
                "approval_type": ApprovalType.GMS_APPROVAL,
                "is_still_valid": True,
                "approval_response_type": ApprovalResponseType.APPROVED,
            },
            {
                "approving_user_id": fmo_reviewer.user_id,
                "approval_type": ApprovalType.FMO_APPROVAL,
                "is_still_valid": True,
                "approval_response_type": ApprovalResponseType.APPROVED,
            },
            {
                "approving_user_id": gmo_reviewer.user_id,
                "approval_type": ApprovalType.GMO_APPROVAL,
                "is_still_valid": True,
                "approval_response_type": ApprovalResponseType.APPROVED,
            },
            {
                "approving_user_id": final_award_rec_approver.user_id,
                "approval_type": ApprovalType.AGENCY_APPROVAL,
                "is_still_valid": True,
                "approval_response_type": ApprovalResponseType.APPROVED,
            },
            {
                "approving_user_id": final_award_rec_approver.user_id,
                "approval_type": ApprovalType.DEPARTMENTAL_APPROVAL,
                "is_still_valid": True,
                "approval_response_type": ApprovalResponseType.APPROVED,
            },
            {
                "approving_user_id": final_award_rec_approver.user_id,
                "approval_type": ApprovalType.INTERAGENCY_APPROVAL,
                "is_still_valid": True,
                "approval_response_type": ApprovalResponseType.APPROVED,
            },
            {
                "approving_user_id": final_award_rec_approver.user_id,
                "approval_type": ApprovalType.EXECUTIVE_APPROVAL,
                "is_still_valid": True,
                "approval_response_type": ApprovalResponseType.APPROVED,
            },
        ],
    )


@pytest.mark.parametrize(
    (
        "starting_state",
        "event_to_send",
        "reviewer_fixture_name",
        "approval_type",
    ),
    [
        (
            AwardRecommendationReviewState.PENDING_GMS_REVIEW,
            "receive_gms_approval",
            "gms_reviewer",
            ApprovalType.GMS_APPROVAL,
        ),
        (
            AwardRecommendationReviewState.PENDING_FMO_REVIEW,
            "receive_fmo_approval",
            "fmo_reviewer",
            ApprovalType.FMO_APPROVAL,
        ),
        (
            AwardRecommendationReviewState.PENDING_GMO_REVIEW,
            "receive_gmo_approval",
            "gmo_reviewer",
            ApprovalType.GMO_APPROVAL,
        ),
        (
            AwardRecommendationReviewState.PENDING_AGENCY_APPROVAL,
            "receive_agency_approval",
            "final_award_rec_approver",
            ApprovalType.AGENCY_APPROVAL,
        ),
        (
            AwardRecommendationReviewState.PENDING_DEPARTMENTAL_APPROVAL,
            "receive_departmental_approval",
            "final_award_rec_approver",
            ApprovalType.DEPARTMENTAL_APPROVAL,
        ),
        (
            AwardRecommendationReviewState.PENDING_INTERAGENCY_APPROVAL,
            "receive_interagency_approval",
            "final_award_rec_approver",
            ApprovalType.INTERAGENCY_APPROVAL,
        ),
        (
            AwardRecommendationReviewState.PENDING_EXECUTIVE_APPROVAL,
            "receive_executive_approval",
            "final_award_rec_approver",
            ApprovalType.EXECUTIVE_APPROVAL,
        ),
    ],
)
def test_award_recommendation_review_requires_modification(
    request,
    db_session,
    agency,
    award_recommendation,
    starting_state,
    event_to_send,
    reviewer_fixture_name,
    approval_type,
):
    """A revision request from any eligible review stage begins revisions."""

    reviewer = request.getfixturevalue(reviewer_fixture_name)

    award_recommendation.status = AwardRecommendationStatus.IN_REVIEW

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.AWARD_RECOMMENDATION_REVIEW,
        current_workflow_state=starting_state,
        award_recommendation=award_recommendation,
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send=event_to_send,
        workflow_id=workflow.workflow_id,
        user=reviewer,
        approval_response_type=ApprovalResponseType.REQUIRES_MODIFICATION,
        comment="Changes are required",
        expected_state=AwardRecommendationReviewState.PENDING_REVISION_START,
    )

    assert (
        state_machine.award_recommendation.award_recommendation_status
        == AwardRecommendationStatus.REVISION_REQUESTED
    )

    validate_approvals(
        state_machine,
        [
            {
                "approving_user_id": reviewer.user_id,
                "approval_type": approval_type,
                "is_still_valid": False,
                "approval_response_type": (ApprovalResponseType.REQUIRES_MODIFICATION),
                "comment": "Changes are required",
            },
        ],
    )


def test_award_recommendation_review_revision_loop(
    db_session,
    agency,
    award_recommendation,
    content_creator,
    gms_reviewer,
):
    """Verify revisions can begin and be resubmitted to PQC."""

    award_recommendation.status = AwardRecommendationStatus.IN_REVIEW

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.AWARD_RECOMMENDATION_REVIEW,
        current_workflow_state=AwardRecommendationReviewState.PENDING_GMS_REVIEW,
        award_recommendation=award_recommendation,
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="receive_gms_approval",
        workflow_id=workflow.workflow_id,
        user=gms_reviewer,
        approval_response_type=ApprovalResponseType.REQUIRES_MODIFICATION,
        comment="Please revise the recommendation",
        expected_state=AwardRecommendationReviewState.PENDING_REVISION_START,
    )

    assert (
        state_machine.award_recommendation.award_recommendation_status
        == AwardRecommendationStatus.REVISION_REQUESTED
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="start_revision",
        workflow_id=workflow.workflow_id,
        user=content_creator,
        expected_state=(AwardRecommendationReviewState.PENDING_REVISION_COMPLETE),
    )

    assert (
        state_machine.award_recommendation.award_recommendation_status
        == AwardRecommendationStatus.IN_REVISION
    )

    state_machine = send_process_event(
        db_session=db_session,
        event_to_send="complete_revisions",
        workflow_id=workflow.workflow_id,
        user=content_creator,
        expected_state=AwardRecommendationReviewState.PENDING_PQC_REVIEW,
    )

    assert (
        state_machine.award_recommendation.award_recommendation_status
        == AwardRecommendationStatus.SUBMITTED
    )

    validate_approvals(
        state_machine,
        [
            {
                "approving_user_id": gms_reviewer.user_id,
                "approval_type": ApprovalType.GMS_APPROVAL,
                "is_still_valid": False,
                "approval_response_type": (ApprovalResponseType.REQUIRES_MODIFICATION),
                "comment": "Please revise the recommendation",
            },
        ],
    )


@pytest.mark.parametrize(
    "event_to_send",
    [
        # Real events, but invalid from the initial state.
        "receive_pqc_approval",
        "start_gms_review",
        "receive_gms_approval",
        "receive_fmo_approval",
        "receive_gmo_approval",
        "receive_agency_approval",
        "receive_departmental_approval",
        "receive_interagency_approval",
        "receive_executive_approval",
        "start_revision",
        "complete_revisions",
    ],
)
def test_award_recommendation_review_invalid_events(
    db_session,
    agency,
    award_recommendation,
    event_to_send,
):
    """Events other than start_workflow are invalid from the start state."""

    user = UserFactory.create()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.AWARD_RECOMMENDATION_REVIEW,
        current_workflow_state=AwardRecommendationReviewState.START,
        award_recommendation=award_recommendation,
    )

    with pytest.raises(
        InvalidEventError,
        match="Event is not valid for workflow",
    ):
        send_process_event(
            db_session=db_session,
            event_to_send=event_to_send,
            workflow_id=workflow.workflow_id,
            user=user,
            expected_state=AwardRecommendationReviewState.START,
        )

    assert len(workflow.workflow_approvals) == 0


@pytest.mark.parametrize(
    (
        "event_to_send",
        "allowed_user_fixture",
        "disallowed_user_fixture",
    ),
    [
        (
            "receive_pqc_approval",
            "pqc_reviewer",
            "gms_reviewer",
        ),
        (
            "receive_gms_approval",
            "gms_reviewer",
            "pqc_reviewer",
        ),
        (
            "receive_fmo_approval",
            "fmo_reviewer",
            "gms_reviewer",
        ),
        (
            "receive_gmo_approval",
            "gmo_reviewer",
            "fmo_reviewer",
        ),
        (
            "receive_agency_approval",
            "final_award_rec_approver",
            "gmo_reviewer",
        ),
        (
            "receive_departmental_approval",
            "final_award_rec_approver",
            "gmo_reviewer",
        ),
        (
            "receive_interagency_approval",
            "final_award_rec_approver",
            "gmo_reviewer",
        ),
        (
            "receive_executive_approval",
            "final_award_rec_approver",
            "gmo_reviewer",
        ),
    ],
)
def test_award_recommendation_review_state_privileges(
    request,
    db_session,
    agency,
    award_recommendation,
    event_to_send,
    allowed_user_fixture,
    disallowed_user_fixture,
):
    """Verify approval events are configured with the expected privileges."""

    allowed_user = request.getfixturevalue(allowed_user_fixture)
    disallowed_user = request.getfixturevalue(disallowed_user_fixture)

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.AWARD_RECOMMENDATION_REVIEW,
        award_recommendation=award_recommendation,
    )

    config = award_recommendation_review_config

    assert (
        can_user_do_agency_approval(
            allowed_user,
            workflow,
            config,
            event_to_send,
        )
        is True
    )

    assert (
        can_user_do_agency_approval(
            disallowed_user,
            workflow,
            config,
            event_to_send,
        )
        is False
    )


def test_award_recommendation_non_approval_events_not_in_approval_mapping(
    db_session,
    agency,
    award_recommendation,
    content_creator,
    gms_reviewer,
):
    """
    Non-approval workflow events are not authorized through ApprovalConfig.

    Authorization for these events must be performed separately.
    """

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.AWARD_RECOMMENDATION_REVIEW,
        award_recommendation=award_recommendation,
    )

    config = award_recommendation_review_config

    for event_to_send in [
        "start_workflow",
        "start_gms_review",
        "start_revision",
        "complete_revisions",
    ]:
        assert (
            can_user_do_agency_approval(
                content_creator,
                workflow,
                config,
                event_to_send,
            )
            is False
        )

        assert (
            can_user_do_agency_approval(
                gms_reviewer,
                workflow,
                config,
                event_to_send,
            )
            is False
        )


def test_award_recommendation_all_approval_events_are_configured():
    """Verify every reviewer approval event has an ApprovalConfig."""

    assert set(award_recommendation_review_config.approval_mapping) == {
        "receive_pqc_approval",
        "receive_gms_approval",
        "receive_fmo_approval",
        "receive_gmo_approval",
        "receive_agency_approval",
        "receive_departmental_approval",
        "receive_interagency_approval",
        "receive_executive_approval",
    }


def test_award_recommendation_state_machine_events():
    """Verify the expected events are exposed by the state machine."""

    assert AwardRecommendationReviewStateMachine.get_valid_events() == {
        "start_workflow",
        "receive_pqc_approval",
        "start_gms_review",
        "receive_gms_approval",
        "receive_fmo_approval",
        "receive_gmo_approval",
        "receive_agency_approval",
        "receive_departmental_approval",
        "receive_interagency_approval",
        "receive_executive_approval",
        "start_revision",
        "complete_revisions",
    }
