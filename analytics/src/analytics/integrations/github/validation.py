"""Pydantic schemas for validating GitHub API responses."""

# pylint: disable=no-self-argument
from datetime import datetime, timedelta

from pydantic import BaseModel, Field, computed_field, model_validator


def safe_default_factory(data: dict, keys_to_replace: list[str]) -> dict:
    """
    Replace keys that are explicitly set to None with an empty dict for default_factory.

    We need to do this because if a key is present, but its value is None or null,
    it will raise a Pydantic ValidationError rather than using the default_factory.
    """
    for key in keys_to_replace:
        if data.get(key) is None:
            data[key] = {}
    return data


# #############################################
# Issue content sub-schemas
# #############################################


class IssueParent(BaseModel):
    """Schema for the parent issue of a sub-issue."""

    title: str | None = None
    url: str | None = None


class IssueType(BaseModel):
    """Schema for the type of an issue."""

    name: str | None = None


class IssueContent(BaseModel):
    """Schema for core issue metadata."""

    title: str
    url: str
    closed: bool
    created_at: str = Field(alias="createdAt")
    closed_at: str | None = Field(alias="closedAt", default=None)
    issue_type: IssueType = Field(alias="type", default_factory=IssueType)
    parent: IssueParent = Field(default_factory=IssueParent)

    @model_validator(mode="before")
    def replace_none_with_defaults(cls, values) -> dict:  # noqa: ANN001, N805
        """Replace None with default_factory instances."""
        # Replace None with default_factory instances
        return safe_default_factory(values, ["type", "parent"])


# #############################################
# Project field sub-schemas
# #############################################


class IterationValue(BaseModel):
    """Schema for iteration field values like Sprint or Quad."""

    iteration_id: str | None = Field(alias="iterationId", default=None)
    title: str | None = None
    start_date: str | None = Field(alias="startDate", default=None)
    duration: int | None = None

    @computed_field
    def end_date(self) -> str | None:
        """Calculate the end date of the iteration."""
        if not self.start_date or not self.duration:
            return None

        start = datetime.strptime(self.start_date, "%Y-%m-%d")  # noqa: DTZ007
        end = start + timedelta(days=self.duration)
        return end.strftime("%Y-%m-%d")


class SingleSelectValue(BaseModel):
    """Schema for single select field values like Status or Pillar."""

    option_id: str | None = Field(alias="optionId", default=None)
    name: str | None = None


class NumberValue(BaseModel):
    """Schema for number field values like Points."""

    number: int | None = None


# #############################################
# Top-level project item schemas
# #############################################


class ProjectItem(BaseModel):
    """Schema that combines fields from both RoadmapItem and SprintItem."""

    # Issue fields
    content: IssueContent
    status: SingleSelectValue = Field(default_factory=SingleSelectValue)
    # Sprint fields
    sprint: IterationValue = Field(default_factory=IterationValue)
    points: NumberValue = Field(default_factory=NumberValue)
    # Roadmap fields
    quad: IterationValue = Field(default_factory=IterationValue)
    pillar: SingleSelectValue = Field(default_factory=SingleSelectValue)

    @model_validator(mode="before")
    def replace_none_with_defaults(cls, values) -> dict:  # noqa: ANN001, N805
        """Replace None with default_factory instances."""
        return safe_default_factory(
            values,
            ["sprint", "points", "quad", "pillar", "status"],
        )
