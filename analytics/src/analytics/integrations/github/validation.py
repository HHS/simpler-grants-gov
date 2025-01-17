"""Pydantic schemas for validating GitHub API responses."""

from datetime import datetime

from pydantic import BaseModel, Field

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
    created_at: datetime = Field(alias="createdAt")
    closed_at: datetime | None = Field(alias="closedAt", default=None)


# #############################################
# Project field sub-schemas
# #############################################


class IterationValue(BaseModel):
    """Schema for iteration field values like Sprint or Quad."""

    iteration_id: str | None = Field(alias="iterationId", default=None)
    title: str | None = None
    start_date: str | None = Field(alias="startDate", default=None)
    duration: int | None = None


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
    """Schema for a project board item."""

    content: IssueContent
    status: SingleSelectValue | None = None


class RoadmapItem(ProjectItem):
    """Schema for an item on the roadmap board."""

    quad: IterationValue | None = None
    pillar: SingleSelectValue | None = None


class SprintItem(ProjectItem):
    """Schema for an item on the sprint board."""

    sprint: IterationValue | None = None
    points: NumberValue | None = None
