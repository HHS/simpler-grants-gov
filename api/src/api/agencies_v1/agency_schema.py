from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema, PaginationMixinSchema
from src.constants.lookup_constants import AgencyDownloadFileType
from src.pagination.pagination_schema import generate_pagination_schema


class AgencyFilterV1Schema(Schema):
    agency_id = fields.Integer()


class AgencyListRequestSchema(Schema):
    filters = fields.Nested(AgencyFilterV1Schema())
    pagination = fields.Nested(
        generate_pagination_schema(
            "AgencyPaginationV1Schema",
            ["created_at"],
        ),
        required=True,
    )


class AgencyContactInfoSchema(Schema):
    """Schema for agency contact information"""

    contact_name = fields.String(metadata={"description": "Full name of the agency contact person"})
    address_line_1 = fields.String(metadata={"description": "Primary street address of the agency"})
    address_line_2 = fields.String(
        allow_none=True,
        metadata={"description": "Additional address information (suite, unit, etc.)"},
    )
    city = fields.String(metadata={"description": "City where the agency is located"})
    state = fields.String(metadata={"description": "State where the agency is located"})
    zip_code = fields.String(metadata={"description": "Postal code for the agency address"})
    phone_number = fields.String(metadata={"description": "Contact phone number for the agency"})
    primary_email = fields.String(
        metadata={"description": "Main email address for agency communications"}
    )
    secondary_email = fields.String(
        allow_none=True,
        metadata={"description": "Alternative email address for agency communications"},
    )


class AgencyResponseSchema(Schema):
    """Schema for agency response"""

    agency_id = fields.Integer()
    agency_name = fields.String()
    agency_code = fields.String()
    sub_agency_code = fields.String(allow_none=True)
    assistance_listing_number = fields.String()
    agency_submission_notification_setting = fields.String()  # Enum value

    # Agency contact info as nested object
    agency_contact_info = fields.Nested(AgencyContactInfoSchema, allow_none=True)

    # Boolean flags
    is_test_agency = fields.Boolean()
    is_multilevel_agency = fields.Boolean()
    is_multiproject = fields.Boolean()
    has_system_to_system_certificate = fields.Boolean()
    can_view_packages_in_grace_period = fields.Boolean()
    is_image_workspace_enabled = fields.Boolean()
    is_validation_workspace_enabled = fields.Boolean()

    # File types as a list of strings
    agency_download_file_types = fields.List(
        fields.Enum(AgencyDownloadFileType),
        metadata={"description": "List of download file types supported by the agency"},
    )

    # Add timestamps from TimestampMixin
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class AgencyListResponseSchema(AbstractResponseSchema, PaginationMixinSchema):
    data = fields.List(
        fields.Nested(AgencyResponseSchema),
        metadata={"description": "A list of agency records"},
    )
