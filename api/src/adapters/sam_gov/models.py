"""Models for SAM.gov API client."""

from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class EntityStatus(StrEnum):
    """Entity status in SAM.gov."""

    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class EntityType(StrEnum):
    """Entity type in SAM.gov."""

    BUSINESS = "BUSINESS"
    GOVERNMENT = "GOVERNMENT"
    INDIVIDUAL = "INDIVIDUAL"


class SensitivityLevel(StrEnum):
    """Sensitivity level for SAM.gov API requests."""

    PUBLIC = "PUBLIC"
    FOUO = "FOUO"
    SENSITIVE = "SENSITIVE"


class FileType(StrEnum):
    """File types available for SAM.gov extracts."""

    ENTITY = "ENTITY"
    EXCLUSION = "EXCLUSION"
    SCR = "SCR"
    BIO = "BIO"


class FileFormat(StrEnum):
    """File formats available for SAM.gov extracts."""

    UTF8 = "UTF8"
    ASCII = "ASCII"


class ExtractType(StrEnum):
    """Extract types available for SAM.gov."""

    MONTHLY = "MONTHLY"
    DAILY = "DAILY"


class SamExtractRequest(BaseModel):
    """Request model for SAM.gov Extract Downloads API."""

    model_config = ConfigDict(validate_assignment=True)

    file_name: str = Field(
        ...,
        description="The specific file name to download (e.g., SAM_PUBLIC_MONTHLY_V2_20220406.ZIP)",
    )

    def to_params(self) -> dict[str, str | bool]:
        """Convert the request to query parameters for the API request."""
        params: dict[str, str | bool] = {}

        if self.file_name:
            params["fileName"] = self.file_name
            # If fileName is specified, other params should not be included
            return params

        return params


class SamExtractResponse(BaseModel):
    """Response metadata for a successful SAM.gov extract download."""

    file_name: str = Field(..., description="The name of the downloaded file")
