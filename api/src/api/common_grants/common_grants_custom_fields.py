""" Marshmallow schemas for CommonGrants Protocol customFields

This file contains Marshmallow schemas that are part of the custom field portion of the specification.

NOTE: Once added here the fields should be imported into another Marshmallow file to register them under the CustomFields class there.
At this time there is only one such file and that is common_grants_schemas.py which only supports Opportunity.py

This pattern allows for simple re-use of custom fields across different base objects since if the fields already exist
it should be as simple as importing the already existing field into the file that requires it and adding it to the CustomFields class
as a new property. 
"""


from typing import Any

from src.api.schemas.extension import Schema, fields
from src.api.schemas.extension import validators as validate


class CustomFieldType(fields.String):
    """Enum field for custom field types."""

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(
            validate=validate.OneOf(["string", "number", "integer", "boolean", "object", "array"]),
            metadata={
                "description": "The JSON schema type to use when de-serializing the value field"
            },
            **kwargs
        )


class CustomField(Schema):
    """Schema for defining custom fields on a record."""

    name = fields.String(required=True, metadata={"example": "eligible_applicants"})
    fieldType = CustomFieldType(required=True)
    schema = fields.URL(allow_none=True, metadata={"example": "https://example.com/schema"})
    value = fields.Raw(required=True, metadata={"example": "nonprofits, state governments"})
    description = fields.String(
        allow_none=True,
        metadata={"example": "The types of organizations eligible to apply"},
    )


# ===========================================================================================
# Custom Field Implementations
# ===========================================================================================

class LegacyId(CustomField):
    """Storing legacy id for compatibility iwth legacy systems"""

    name = fields.String(required=True,
                         metadata={
                             "example": "legacyId"
                        })
    fieldType = fields.String(required=True, metadata={"example": "integer"})
    value = fields.Integer(required=True,
                           metadata={"example": "12345"})
    description = fields.String(allow_none=True,
                                metadata={"example": "An integer ID for the opportunity, needed for compatibility with legacy systems"})


class FederalOpportunityNumber(CustomField):
    """Federal Opportunity Number assigned to this grant opportunity"""

    name = fields.String(required=True,
                         metadata={
                            "example": "federalOpportunityNumber"
                         })
    fieldType = fields.String(required=True, metadata={"example": "string"})
    value = fields.String(required=True,
                          metadata={
                            "example": "ABC-123-XYZ-001"
                        })
    description = fields.String(allow_none=True,
                                metadata={"example": "The federal opportunity number assigned to this grant opportunity"})


class AssistanceListingValue(Schema):
    """Schema for populating the AssistanceListing value field"""
    assistanceListingNumber = fields.String(required=True, metadata={"example": "43.012"})
    programTitle = fields.String(required=True, metadata={"example": "Space Technology"})


class AssistanceListing(CustomField):
    """The assistance listing number and program title for this opportunity"""
    name = fields.String(required=True,
                         metadata={
                             "example": "assistanceListing"
                         })
    fieldType = fields.String(required=True, metadata={"example": "object"})
    value = fields.Nested(AssistanceListingValue, required=True)
    description = fields.String(
        allow_none=True,
        metadata={"example": "The assistance listing number and program title for this opportunity"}
    )


class AgencyValue(Schema):
    """Schema for populating the Agency value field"""
    agencyCode = fields.String(required=True, metadata={"example": "US-ABC"})
    agencyName = fields.String(required=True, metadata={"example": "Department of Examples"})
    topLevelAgencyName = fields.String(required=True, metadata={"example": "Department of Examples"})


class Agency(CustomField):
    """Information about the agency offering this opportunity"""
    name = fields.String(required=True,
                         metadata={"example": "agency"})
    fieldType = fields.String(required=True, metadata={"example": "object"})
    value = fields.Nested(AgencyValue, required=True)
    description = fields.String(
        allow_none=True,
        metadata={"example": "Information about the agency offering this opportunity"}
    )


class AttachmentValue(Schema):
    downloadUrl = fields.URL(required=True, metadata={"example": "https://example.com/file.pdf"})
    name = fields.String(required=True, metadata={"example": "example.pdf"})
    description = fields.String(allow_none=True, metadata={"example": "A PDF file with instructions"})
    sizeInBytes = fields.Integer(required=True, metadata={"example": 1000})
    mimeType = fields.String(required=True, metadata={"example": "application/pdf"})
    createdAt = fields.DateTime(required=True, metadata={"example": "2025-01-01T17:01:01.000Z"})
    lastModifiedAt = fields.DateTime(required=True, metadata={"example": "2025-01-02T17:30:00.000Z"})


class Attachments(CustomField):
    """Attachments such as NOFOs or other supplemental documents"""
    name = fields.String(required=True,
                         metadata={
                             "example": "attachments"
                         })
    fieldType = fields.String(required=True, metadata={"example": "array"})
    value = fields.List(fields.Nested(AttachmentValue), required=True)
    description = fields.String(
        allow_none=True,
        metadata={"example": "Attachments such as NOFOs and supplemental documents for the opportunity"},
    )


class Category(CustomField):
    """The category type of the grant opportunity"""

    name = fields.String(required=True, metadata={"example": "category"})
    fieldType = fields.String(required=True, metadata={"example": "string"})
    value = fields.String(required=True, metadata={"example": "discretionary"})
    description = fields.String(
        allow_none=True,
        metadata={"example": "The category type of the grant opportunity"},
    )


class AgencyContactValue(Schema):
    """Schema for populating the AgencyContact value field"""

    description = fields.String(required=True, metadata={"example": "For more information, reach out to Jane Smith at agency US-ABC"})
    emailAddress = fields.String(required=True, metadata={"example": "fake_email@grants.gov"})
    emailDescription = fields.String(required=True, metadata={"example": "Click me to email the agency"})


class AgencyContact(CustomField):
    """Contact information for the agency managing this opportunity"""

    name = fields.String(required=True, metadata={"example": "agencyContact"})
    fieldType = fields.String(required=True, metadata={"example": "object"})
    value = fields.Nested(AgencyContactValue, required=True)
    description = fields.String(
        allow_none=True,
        metadata={"example": "Contact information for the agency managing this opportunity"},
    )


class AdditionalInfoValue(Schema):
    """Schema for populating the AdditionalInfo value field"""

    url = fields.String(required=True, metadata={"example": "grants.gov"})
    description = fields.String(required=True, metadata={"example": "Click me for more info"})


class AdditionalInfo(CustomField):
    """URL and description for additional information about the opportunity"""

    name = fields.String(required=True, metadata={"example": "additionalInfo"})
    fieldType = fields.String(required=True, metadata={"example": "object"})
    value = fields.Nested(AdditionalInfoValue, required=True)
    description = fields.String(
        allow_none=True,
        metadata={"example": "URL and description for additional information about the opportunity"},
    )


class CostSharing(CustomField):
    """Whether cost sharing or matching funds are required for this opportunity"""

    name = fields.String(required=True, metadata={"example": "costSharing"})
    fieldType = fields.String(required=True, metadata={"example": "boolean"})
    value = fields.Boolean(required=True, metadata={"example": True})
    description = fields.String(
        allow_none=True,
        metadata={"example": "Whether cost sharing or matching funds are required for this opportunity"},
    )


class FiscalYear(CustomField):
    """The fiscal year associated with this opportunity"""

    name = fields.String(required=True, metadata={"example": "fiscalYear"})
    fieldType = fields.String(required=True, metadata={"example": "number"})
    value = fields.Integer(required=True, metadata={"example": 2026})
    description = fields.String(
        allow_none=True,
        metadata={"example": "The fiscal year associated with this opportunity"},
    )
