from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema, PaginationMixinSchema
from src.api.schemas.search_schema import BoolSearchSchemaBuilder, StrSearchSchemaBuilder
from src.api.schemas.shared_schema import SimpleUserSchema
from src.constants.lookup_constants import (
    AwardRecommendationAttachmentType,
    AwardRecommendationReviewType,
    AwardRecommendationStatus,
    AwardRecommendationType,
    AwardSelectionMethod,
    OpportunityStatus,
)
from src.pagination.pagination_schema import generate_pagination_schema


class AwardRecommendationOpportunitySummarySchema(Schema):
    """Schema for the award recommendation opportunity summary"""

    opportunity_status = fields.Enum(
        OpportunityStatus,
        allow_none=True,
        metadata={"description": "The status of the opportunity"},
    )
    summary_description = fields.String(
        allow_none=True,
        metadata={
            "description": "The summary of the opportunity",
            "example": "This opportunity aims to unravel the mysteries of the universe.",
        },
    )


class AwardRecommendationOpportunitySchema(Schema):
    """Schema for the award recommendation opportunity"""

    opportunity_id = fields.UUID(metadata={"description": "The opportunity ID"})
    opportunity_number = fields.String(
        allow_none=True,
        metadata={
            "description": "The opportunity number",
            "example": "O-BJA-2025-202930-STG",
        },
    )
    opportunity_title = fields.String(
        allow_none=True,
        metadata={
            "description": "The title of the opportunity",
            "example": "Research into conservation techniques",
        },
    )
    summary = fields.Nested(
        AwardRecommendationOpportunitySummarySchema,
        allow_none=True,
        metadata={"description": "Summary details of the opportunity"},
    )


class AwardRecommendationAttachmentSchema(Schema):
    """Schema for the award recommendation attachments"""

    award_recommendation_attachment_id = fields.UUID(
        metadata={"description": "The attachment's unique identifier"}
    )
    download_path = fields.String(
        metadata={
            "description": "The presigned URL to download the attachment",
            "example": "https://s3.amazonaws.com/bucket/path/to/my_example.pdf",
        },
    )
    file_name = fields.String(
        metadata={
            "description": "The file name of the attachment",
            "example": "my_example.pdf",
        }
    )
    award_recommendation_attachment_type = fields.Enum(
        AwardRecommendationAttachmentType,
        metadata={"description": "The type of the attachment"},
    )
    uploading_user = fields.Nested(
        SimpleUserSchema,
        metadata={"description": "The user who uploaded the attachment"},
    )
    created_at = fields.DateTime(metadata={"description": "When the attachment was created"})
    updated_at = fields.DateTime(metadata={"description": "When the attachment was last updated"})


class AwardRecommendationReviewSchema(Schema):
    """Schema for the award recommendation reviews"""

    award_recommendation_review_id = fields.UUID(
        metadata={"description": "The review's unique identifier"}
    )
    award_recommendation_review_type = fields.Enum(
        AwardRecommendationReviewType,
        metadata={"description": "The type of the review"},
    )
    is_reviewed = fields.Boolean(metadata={"description": "Whether the review has been completed"})


class AwardRecommendationDataSchema(Schema):
    """Schema for the award recommendation details"""

    award_recommendation_id = fields.UUID(
        metadata={"description": "The award recommendation's unique identifier"}
    )
    award_recommendation_number = fields.String(
        metadata={
            "description": "The generated award recommendation number",
            "example": "AR-26-0001",
        },
    )
    award_recommendation_status = fields.Enum(
        AwardRecommendationStatus,
        metadata={"description": "The status of the award recommendation"},
    )
    award_selection_method = fields.Enum(
        AwardSelectionMethod,
        allow_none=True,
        metadata={"description": "The method used to select the award"},
    )
    additional_info = fields.String(
        allow_none=True,
        metadata={
            "description": "Additional info about the opportunity",
            "example": "Program office requests expedited processing due to deadline in September.",
        },
    )
    selection_method_detail = fields.String(
        allow_none=True,
        metadata={
            "description": "Additional detail about the selection method",
            "example": "Selection factors included technical merit, past performance, and cost.",
        },
    )
    other_key_information = fields.String(
        allow_none=True,
        metadata={
            "description": "Other key information",
            "example": "This opportunity aligns with the agency's rural access initiative and requires interagency coordination.",
        },
    )
    review_workflow_id = fields.UUID(
        allow_none=True,
        metadata={"description": "The workflow ID for the review process"},
    )
    opportunity = fields.Nested(
        AwardRecommendationOpportunitySchema,
        metadata={"description": "The associated opportunity"},
    )
    award_recommendation_attachments = fields.List(
        fields.Nested(AwardRecommendationAttachmentSchema),
        dump_default=[],
        metadata={"description": "Attachments associated with the award recommendation"},
    )
    award_recommendation_reviews = fields.List(
        fields.Nested(AwardRecommendationReviewSchema),
        dump_default=[],
        metadata={"description": "Reviews associated with the award recommendation"},
    )


class AwardRecommendationGetResponseSchema(AbstractResponseSchema):
    data = fields.Nested(
        AwardRecommendationDataSchema,
        metadata={"description": "The award recommendation details"},
    )


####################################
# List Award Recommendation Submissions
####################################


class AwardRecommendationSubmissionFilterSchema(Schema):
    """Schema for the award recommendation submission filters"""

    award_recommendation_type = fields.Nested(
        StrSearchSchemaBuilder("AwardRecSubmissionTypeFilterSchema")
        .with_one_of(allowed_values=AwardRecommendationType)
        .build()
    )
    has_exception = fields.Nested(
        BoolSearchSchemaBuilder("AwardRecSubmissionExceptionFilterSchema").with_one_of().build()
    )


class AwardRecommendationSubmissionListRequestSchema(Schema):
    """Schema for POST /alpha/award-recommendations/:award_recommendation_id/submissions/list request"""

    filters = fields.Nested(AwardRecommendationSubmissionFilterSchema(), required=False)

    pagination = fields.Nested(
        generate_pagination_schema(
            "AwardRecSubmissionPaginationSchema",
            ["application_submission_number"],
            default_sort_order=[
                {"order_by": "application_submission_number", "sort_direction": "ascending"}
            ],
        ),
        required=True,
    )


class SubmissionOrganizationSchema(Schema):
    """Schema for the award recommendation submission organization"""

    organization_id = fields.UUID(metadata={"description": "The organization ID"})
    organization_name = fields.String(
        allow_none=True,
        metadata={"description": "The organization name"},
    )


class SubmissionApplicationSchema(Schema):
    """Schema for the award recommendation submission application"""

    application_id = fields.UUID(metadata={"description": "The application ID"})
    competition_id = fields.UUID(metadata={"description": "The competition ID"})
    organization = fields.Nested(
        SubmissionOrganizationSchema,
        allow_none=True,
        metadata={"description": "The organization that submitted the application"},
    )


class SubmissionApplicationSubmissionSchema(Schema):
    """Schema for the award recommendation submission application"""

    application_submission_id = fields.UUID(
        metadata={"description": "The application submission ID"}
    )
    application_submission_number = fields.String(
        allow_none=True,
        metadata={
            "description": "The application submission number",
            "example": "SUB-2026-00001",
        },
    )
    project_title = fields.String(
        allow_none=True,
        metadata={
            "description": "The project title",
            "example": "Rural broadband expansion initiative",
        },
    )
    total_requested_amount = fields.Decimal(
        allow_none=True,
        as_string=True,
        metadata={
            "description": "The total requested funding amount",
            "example": "250000.00",
        },
    )
    application = fields.Nested(
        SubmissionApplicationSchema,
        metadata={"description": "The application associated with this submission"},
    )


class AwardRecommendationSubmissionDetailSchema(Schema):
    """Schema for the award recommendation submission detail"""

    recommended_amount = fields.Decimal(
        allow_none=True,
        as_string=True,
        metadata={
            "description": "The recommended funding amount",
            "example": "200000.00",
        },
    )
    scoring_comment = fields.String(
        allow_none=True,
        metadata={"description": "Comments from the scoring process"},
    )
    general_comment = fields.String(
        allow_none=True,
        metadata={"description": "General comments about the submission"},
    )
    award_recommendation_type = fields.Enum(
        AwardRecommendationType,
        allow_none=True,
        metadata={"description": "The recommendation type for this submission"},
    )
    has_exception = fields.Boolean(
        metadata={"description": "Whether the submission has an exception"},
    )
    exception_detail = fields.String(
        allow_none=True,
        metadata={"description": "Details about the exception, if any"},
    )


class AwardRecommendationSubmissionDataSchema(Schema):
    """Schema for the award recommendation submission data"""

    award_recommendation_application_submission_id = fields.UUID(
        metadata={"description": "The award recommendation application submission ID"}
    )
    application_submission = fields.Nested(
        SubmissionApplicationSubmissionSchema,
        metadata={"description": "The application submission"},
    )
    submission_detail = fields.Nested(
        AwardRecommendationSubmissionDetailSchema,
        attribute="award_recommendation_submission_detail",
        metadata={"description": "The recommendation details for this submission"},
    )


class AwardRecommendationSubmissionListResponseSchema(
    AbstractResponseSchema, PaginationMixinSchema
):
    """Schema for POST /alpha/award-recommendations/:award_recommendation_id/submissions/list response"""

    data = fields.List(
        fields.Nested(AwardRecommendationSubmissionDataSchema),
        metadata={"description": "The list of award recommendation submissions"},
    )
