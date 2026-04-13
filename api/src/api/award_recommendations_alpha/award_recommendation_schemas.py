from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema
from src.api.schemas.shared_schema import SimpleUserSchema
from src.constants.lookup_constants import (
    AwardRecommendationAttachmentType,
    AwardRecommendationReviewType,
    AwardRecommendationStatus,
    AwardSelectionMethod,
    OpportunityStatus,
)


class AwardRecommendationCreateRequestSchema(Schema):
    """Schema for POST /alpha/award-recommendations request"""

    opportunity_id = fields.UUID(
        required=True,
        metadata={"description": "The opportunity ID for the award recommendation"},
    )
    award_selection_method = fields.Enum(
        AwardSelectionMethod,
        required=True,
        metadata={"description": "The method used to select the award"},
    )
    additional_info = fields.String(
        allow_none=True,
        metadata={"description": "Additional info about the award recommendation"},
    )
    funding_strategy = fields.String(
        allow_none=True,
        metadata={"description": "Funding strategy information for the award recommendation"},
    )
    other_key_information = fields.String(
        allow_none=True,
        metadata={"description": "Other key information for the award recommendation"},
    )


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
