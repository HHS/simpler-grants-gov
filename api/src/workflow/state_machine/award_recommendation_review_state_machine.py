from enum import StrEnum
from typing import Any

from statemachine import Event
from statemachine.states import States

from src.constants.lookup_constants import (
    ApprovalResponseType,
    ApprovalType,
    AwardRecommendationStatus,
    Privilege,
    WorkflowEntityType,
    WorkflowType,
)
from src.workflow.base_state_machine import BaseStateMachine
from src.workflow.registry.workflow_registry import WorkflowRegistry
from src.workflow.state_persistence.award_recommendation_persistence_model import (
    AwardRecommendationPersistenceModel,
)
from src.workflow.workflow_config import ApprovalConfig, WorkflowConfig
from src.workflow.workflow_constants import WorkflowConstants


class AwardRecommendationReviewState(StrEnum):
    START = "start"

    PENDING_PQC_REVIEW = "pending_pqc_review"

    PENDING_GMS_REVIEW_START = "pending_gms_review_start"
    PENDING_GMS_REVIEW = "pending_gms_review"

    PENDING_FMO_REVIEW = "pending_fmo_review"
    PENDING_GMO_REVIEW = "pending_gmo_review"

    PENDING_AGENCY_APPROVAL = "pending_agency_approval"
    PENDING_DEPARTMENTAL_APPROVAL = "pending_departmental_approval"
    PENDING_INTERAGENCY_APPROVAL = "pending_interagency_approval"
    PENDING_EXECUTIVE_APPROVAL = "pending_executive_approval"

    PENDING_REVISION_START = "pending_revision_start"
    PENDING_REVISION_COMPLETE = "pending_revision_complete"

    END = "end"


award_recommendation_review_config = WorkflowConfig(
    workflow_type=WorkflowType.AWARD_RECOMMENDATION_REVIEW,
    persistence_model_cls=AwardRecommendationPersistenceModel,
    entity_type=WorkflowEntityType.AWARD_RECOMMENDATION,
    approval_mapping={
        "receive_pqc_approval": ApprovalConfig(
            approval_type=ApprovalType.PQC_APPROVAL,
            approval_state=AwardRecommendationReviewState.PENDING_PQC_REVIEW,
            required_privileges=[Privilege.PQC_REVIEWER],
            allowed_approval_response_types={
                ApprovalResponseType.APPROVED,
            },
        ),
        "receive_gms_approval": ApprovalConfig(
            approval_type=ApprovalType.GMS_APPROVAL,
            approval_state=AwardRecommendationReviewState.PENDING_GMS_REVIEW,
            required_privileges=[Privilege.GMS_REVIEWER],
            allowed_approval_response_types={
                ApprovalResponseType.APPROVED,
                ApprovalResponseType.REQUIRES_MODIFICATION,
            },
        ),
        "receive_fmo_approval": ApprovalConfig(
            approval_type=ApprovalType.FMO_APPROVAL,
            approval_state=AwardRecommendationReviewState.PENDING_FMO_REVIEW,
            required_privileges=[Privilege.FMO_REVIEWER],
            allowed_approval_response_types={
                ApprovalResponseType.APPROVED,
                ApprovalResponseType.REQUIRES_MODIFICATION,
            },
        ),
        "receive_gmo_approval": ApprovalConfig(
            approval_type=ApprovalType.GMO_APPROVAL,
            approval_state=AwardRecommendationReviewState.PENDING_GMO_REVIEW,
            required_privileges=[Privilege.GMO_REVIEWER],
            allowed_approval_response_types={
                ApprovalResponseType.APPROVED,
                ApprovalResponseType.REQUIRES_MODIFICATION,
            },
        ),
        "receive_agency_approval": ApprovalConfig(
            approval_type=ApprovalType.AGENCY_APPROVAL,
            approval_state=AwardRecommendationReviewState.PENDING_AGENCY_APPROVAL,
            required_privileges=[Privilege.FINAL_AWARD_REC_APPROVER],
            allowed_approval_response_types={
                ApprovalResponseType.APPROVED,
                ApprovalResponseType.REQUIRES_MODIFICATION,
            },
        ),
        "receive_departmental_approval": ApprovalConfig(
            approval_type=ApprovalType.DEPARTMENTAL_APPROVAL,
            approval_state=AwardRecommendationReviewState.PENDING_DEPARTMENTAL_APPROVAL,
            required_privileges=[Privilege.FINAL_AWARD_REC_APPROVER],
            allowed_approval_response_types={
                ApprovalResponseType.APPROVED,
                ApprovalResponseType.REQUIRES_MODIFICATION,
            },
        ),
        "receive_interagency_approval": ApprovalConfig(
            approval_type=ApprovalType.INTERAGENCY_APPROVAL,
            approval_state=AwardRecommendationReviewState.PENDING_INTERAGENCY_APPROVAL,
            required_privileges=[Privilege.FINAL_AWARD_REC_APPROVER],
            allowed_approval_response_types={
                ApprovalResponseType.APPROVED,
                ApprovalResponseType.REQUIRES_MODIFICATION,
            },
        ),
        "receive_executive_approval": ApprovalConfig(
            approval_type=ApprovalType.EXECUTIVE_APPROVAL,
            approval_state=AwardRecommendationReviewState.PENDING_EXECUTIVE_APPROVAL,
            required_privileges=[Privilege.FINAL_AWARD_REC_APPROVER],
            allowed_approval_response_types={
                ApprovalResponseType.APPROVED,
                ApprovalResponseType.REQUIRES_MODIFICATION,
            },
        ),
    },
)


@WorkflowRegistry.register_workflow(award_recommendation_review_config)
class AwardRecommendationReviewStateMachine(BaseStateMachine):
    ### States

    states = States.from_enum(
        AwardRecommendationReviewState,
        initial=AwardRecommendationReviewState.START,
        final=AwardRecommendationReviewState.END,
    )

    ### Workflow start

    start_workflow = Event(
        states.START.to(
            states.PENDING_PQC_REVIEW,
            on="set_status_submitted",
        ),
    )

    ### PQC review
    #
    # PQC is approval-only. The award recommendation remains in the
    # Submitted status after PQC approval.

    receive_pqc_approval = Event(
        states.PENDING_PQC_REVIEW.to(
            states.PENDING_GMS_REVIEW_START,
            cond=WorkflowConstants.IS_APPROVAL_EVENT_APPROVED,
            on=WorkflowConstants.ON_AGENCY_APPROVAL_APPROVED,
        ),
    )

    ### GMS review start
    #
    # The award recommendation moves from Submitted to In Review when
    # the GMS reviewer begins their review.

    start_gms_review = Event(
        states.PENDING_GMS_REVIEW_START.to(
            states.PENDING_GMS_REVIEW,
            on="set_status_in_review",
        ),
    )

    ### GMS review

    receive_gms_approval = Event(
        # Approved: record the approval and continue to FMO review.
        states.PENDING_GMS_REVIEW.to(
            states.PENDING_FMO_REVIEW,
            cond=WorkflowConstants.IS_APPROVAL_EVENT_APPROVED,
            on=WorkflowConstants.ON_AGENCY_APPROVAL_APPROVED,
        )
        |
        # Requires modification: record the response and begin
        # the revision process.
        states.PENDING_GMS_REVIEW.to(
            states.PENDING_REVISION_START,
            cond=WorkflowConstants.IS_APPROVAL_EVENT_REQUIRES_MODIFICATION,
            on=[
                WorkflowConstants.ON_AGENCY_APPROVAL_REQUIRES_MODIFICATION,
                "set_status_revision_requested",
            ],
        ),
    )

    ### FMO review

    receive_fmo_approval = Event(
        states.PENDING_FMO_REVIEW.to(
            states.PENDING_GMO_REVIEW,
            cond=WorkflowConstants.IS_APPROVAL_EVENT_APPROVED,
            on=WorkflowConstants.ON_AGENCY_APPROVAL_APPROVED,
        )
        | states.PENDING_FMO_REVIEW.to(
            states.PENDING_REVISION_START,
            cond=WorkflowConstants.IS_APPROVAL_EVENT_REQUIRES_MODIFICATION,
            on=[
                WorkflowConstants.ON_AGENCY_APPROVAL_REQUIRES_MODIFICATION,
                "set_status_revision_requested",
            ],
        ),
    )

    ### GMO review

    receive_gmo_approval = Event(
        states.PENDING_GMO_REVIEW.to(
            states.PENDING_AGENCY_APPROVAL,
            cond=WorkflowConstants.IS_APPROVAL_EVENT_APPROVED,
            on=WorkflowConstants.ON_AGENCY_APPROVAL_APPROVED,
        )
        | states.PENDING_GMO_REVIEW.to(
            states.PENDING_REVISION_START,
            cond=WorkflowConstants.IS_APPROVAL_EVENT_REQUIRES_MODIFICATION,
            on=[
                WorkflowConstants.ON_AGENCY_APPROVAL_REQUIRES_MODIFICATION,
                "set_status_revision_requested",
            ],
        ),
    )

    ### Agency approval

    receive_agency_approval = Event(
        states.PENDING_AGENCY_APPROVAL.to(
            states.PENDING_DEPARTMENTAL_APPROVAL,
            cond=WorkflowConstants.IS_APPROVAL_EVENT_APPROVED,
            on=WorkflowConstants.ON_AGENCY_APPROVAL_APPROVED,
        )
        | states.PENDING_AGENCY_APPROVAL.to(
            states.PENDING_REVISION_START,
            cond=WorkflowConstants.IS_APPROVAL_EVENT_REQUIRES_MODIFICATION,
            on=[
                WorkflowConstants.ON_AGENCY_APPROVAL_REQUIRES_MODIFICATION,
                "set_status_revision_requested",
            ],
        ),
    )

    ### Departmental approval

    receive_departmental_approval = Event(
        states.PENDING_DEPARTMENTAL_APPROVAL.to(
            states.PENDING_INTERAGENCY_APPROVAL,
            cond=WorkflowConstants.IS_APPROVAL_EVENT_APPROVED,
            on=WorkflowConstants.ON_AGENCY_APPROVAL_APPROVED,
        )
        | states.PENDING_DEPARTMENTAL_APPROVAL.to(
            states.PENDING_REVISION_START,
            cond=WorkflowConstants.IS_APPROVAL_EVENT_REQUIRES_MODIFICATION,
            on=[
                WorkflowConstants.ON_AGENCY_APPROVAL_REQUIRES_MODIFICATION,
                "set_status_revision_requested",
            ],
        ),
    )

    ### Interagency approval

    receive_interagency_approval = Event(
        states.PENDING_INTERAGENCY_APPROVAL.to(
            states.PENDING_EXECUTIVE_APPROVAL,
            cond=WorkflowConstants.IS_APPROVAL_EVENT_APPROVED,
            on=WorkflowConstants.ON_AGENCY_APPROVAL_APPROVED,
        )
        | states.PENDING_INTERAGENCY_APPROVAL.to(
            states.PENDING_REVISION_START,
            cond=WorkflowConstants.IS_APPROVAL_EVENT_REQUIRES_MODIFICATION,
            on=[
                WorkflowConstants.ON_AGENCY_APPROVAL_REQUIRES_MODIFICATION,
                "set_status_revision_requested",
            ],
        ),
    )

    ### Executive approval

    receive_executive_approval = Event(
        states.PENDING_EXECUTIVE_APPROVAL.to(
            states.END,
            cond=WorkflowConstants.IS_APPROVAL_EVENT_APPROVED,
            on=[
                WorkflowConstants.ON_AGENCY_APPROVAL_APPROVED,
                "set_status_approved",
            ],
        )
        | states.PENDING_EXECUTIVE_APPROVAL.to(
            states.PENDING_REVISION_START,
            cond=WorkflowConstants.IS_APPROVAL_EVENT_REQUIRES_MODIFICATION,
            on=[
                WorkflowConstants.ON_AGENCY_APPROVAL_REQUIRES_MODIFICATION,
                "set_status_revision_requested",
            ],
        ),
    )

    ### Revision process

    start_revision = Event(
        states.PENDING_REVISION_START.to(
            states.PENDING_REVISION_COMPLETE,
            on="set_status_in_revision",
        ),
    )

    complete_revisions = Event(
        states.PENDING_REVISION_COMPLETE.to(
            states.PENDING_PQC_REVIEW,
            on="set_status_submitted",
        ),
    )

    def __init__(
        self,
        model: AwardRecommendationPersistenceModel,
        **kwargs: Any,
    ):
        super().__init__(model=model, **kwargs)
        self.award_recommendation = model.award_recommendation

    #############################
    # Award recommendation status handlers
    #############################

    def set_status_submitted(self, **kwargs: Any) -> None:
        self.award_recommendation.award_recommendation_status = AwardRecommendationStatus.SUBMITTED

    def set_status_in_review(self, **kwargs: Any) -> None:
        self.award_recommendation.award_recommendation_status = AwardRecommendationStatus.IN_REVIEW

    def set_status_revision_requested(self, **kwargs: Any) -> None:
        self.award_recommendation.award_recommendation_status = (
            AwardRecommendationStatus.REVISION_REQUESTED
        )

    def set_status_in_revision(self, **kwargs: Any) -> None:
        self.award_recommendation.award_recommendation_status = (
            AwardRecommendationStatus.IN_REVISION
        )

    def set_status_approved(self, **kwargs: Any) -> None:
        self.award_recommendation.award_recommendation_status = AwardRecommendationStatus.APPROVED
