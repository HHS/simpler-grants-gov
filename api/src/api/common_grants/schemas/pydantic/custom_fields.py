"""Pydantic schemas for CommonGrants Protocol customFields.

This file contains typed Pydantic subclasses of CustomField for each custom field
populated by the populate_custom_fields function in the transformation layer.
"""

from datetime import datetime

from common_grants_sdk.schemas.pydantic import CustomField, CustomFieldType
from pydantic import BaseModel, HttpUrl, ValidationError, field_validator

# ===========================================================================================
# Value Models
# ===========================================================================================


class AssistanceListingValue(BaseModel):
    identifier: str | None = None
    programTitle: str | None = None


class AgencyValue(BaseModel):
    code: str
    name: str | None = None
    parentName: str | None = None
    parentCode: str | None = None


class _AttachmentUrlValidator(BaseModel):
    url: HttpUrl


class AttachmentValue(BaseModel):
    downloadUrl: str | None = None
    name: str
    description: str | None = None
    sizeInBytes: int
    mimeType: str
    createdAt: datetime
    lastModifiedAt: datetime

    @field_validator("downloadUrl", mode="before")
    @classmethod
    def validate_download_url(cls, v: object) -> object:
        if v is None or v == "":
            return None
        try:
            _AttachmentUrlValidator.model_validate({"url": v})
            return v
        except ValidationError:
            return None


class ContactInfoValue(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    description: str | None = None


class AdditionalInfoValue(BaseModel):
    url: str | None = None
    description: str | None = None


# ===========================================================================================
# Custom Field Implementations
# ===========================================================================================


class LegacySerialIdField(CustomField):
    """An integer ID for the opportunity, needed for compatibility with legacy systems."""

    name: str = "legacySerialId"
    field_type: CustomFieldType = CustomFieldType.INTEGER
    schema_url: HttpUrl | None = HttpUrl("https://commongrants.org/custom-fields/legacySerialId/")
    value: int
    description: str | None = (
        "An integer ID for the opportunity, needed for compatibility with legacy systems"
    )

    model_config = {"populate_by_name": True}


class FederalOpportunityNumberField(CustomField):
    """The federal opportunity number assigned to this grant opportunity."""

    name: str = "federalOpportunityNumber"
    field_type: CustomFieldType = CustomFieldType.STRING
    schema_url: HttpUrl | None = HttpUrl(
        "https://commongrants.org/custom-fields/federalOpportunityNumber/"
    )
    value: str
    description: str | None = "The federal opportunity number assigned to this grant opportunity"

    model_config = {"populate_by_name": True}


class AssistanceListingsField(CustomField):
    """The assistance listing number and program title for this opportunity."""

    name: str = "assistanceListings"
    field_type: CustomFieldType = CustomFieldType.ARRAY
    schema_url: HttpUrl | None = HttpUrl(
        "https://commongrants.org/custom-fields/assistanceListings/"
    )
    value: list[AssistanceListingValue]
    description: str | None = "The assistance listing number and program title for this opportunity"

    model_config = {"populate_by_name": True}


class AgencyField(CustomField):
    """Information about the agency offering this opportunity."""

    name: str = "agency"
    field_type: CustomFieldType = CustomFieldType.OBJECT
    schema_url: HttpUrl | None = HttpUrl("https://commongrants.org/custom-fields/agency/")
    value: AgencyValue
    description: str | None = "Information about the agency offering this opportunity"

    model_config = {"populate_by_name": True}


class AttachmentsField(CustomField):
    """Attachments such as NOFOs and supplemental documents for the opportunity."""

    name: str = "attachments"
    field_type: CustomFieldType = CustomFieldType.ARRAY
    schema_url: HttpUrl | None = HttpUrl("https://commongrants.org/custom-fields/attachments/")
    value: list[AttachmentValue]
    description: str | None = (
        "Attachments such as NOFOs and supplemental documents for the opportunity"
    )

    model_config = {"populate_by_name": True}


class FederalFundingSourceField(CustomField):
    """The category type of the grant opportunity."""

    name: str = "federalFundingSource"
    field_type: CustomFieldType = CustomFieldType.ARRAY
    schema_url: HttpUrl | None = HttpUrl(
        "https://commongrants.org/custom-fields/federalFundingSource/"
    )
    value: list[str]
    description: str | None = "The category type of the grant opportunity"

    model_config = {"populate_by_name": True}


class ContactInfoField(CustomField):
    """Contact information for the agency managing this opportunity."""

    name: str = "contactInfo"
    field_type: CustomFieldType = CustomFieldType.OBJECT
    schema_url: HttpUrl | None = HttpUrl("https://commongrants.org/custom-fields/contactInfo/")
    value: ContactInfoValue
    description: str | None = (
        "Contact information (name, email, phone, description) for this resource"
    )

    model_config = {"populate_by_name": True}


class AdditionalInfoField(CustomField):
    """URL and description for additional information about the opportunity."""

    name: str = "additionalInfo"
    field_type: CustomFieldType = CustomFieldType.OBJECT
    schema_url: HttpUrl | None = HttpUrl("https://commongrants.org/custom-fields/additionalInfo/")
    value: AdditionalInfoValue
    description: str | None = "URL and description for additional information about the opportunity"

    model_config = {"populate_by_name": True}


class FiscalYearField(CustomField):
    """The fiscal year associated with this opportunity."""

    name: str = "fiscalYear"
    field_type: CustomFieldType = CustomFieldType.INTEGER
    schema_url: HttpUrl | None = HttpUrl("https://commongrants.org/custom-fields/fiscalYear/")
    value: int
    description: str | None = "The fiscal year associated with this opportunity"

    model_config = {"populate_by_name": True}


class CostSharingValue(BaseModel):
    isRequired: bool | None = None


class CostSharingField(CustomField):
    """Whether cost sharing or matching funds are required for this opportunity."""

    name: str = "costSharing"
    field_type: CustomFieldType = CustomFieldType.OBJECT
    schema_url: HttpUrl | None = HttpUrl("https://commongrants.org/custom-fields/costSharing/")
    value: CostSharingValue
    description: str | None = (
        "Whether cost sharing or matching funds are required for this opportunity"
    )

    model_config = {"populate_by_name": True}
