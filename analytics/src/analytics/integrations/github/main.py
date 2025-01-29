"""
Export data from GitHub.

TODO(widal001): 2025-01-04 Refactor and move this to src/analytics/etl/github when
we disable writing to disk in https://github.com/HHS/simpler-grants-gov/issues/3203
"""

import logging
from pathlib import Path

from pydantic import ValidationError

from analytics.integrations.github.client import GitHubGraphqlClient
from analytics.integrations.github.validation import ProjectItem

logger = logging.getLogger(__name__)

PARENT_DIR = Path(__file__).resolve().parent


def transform_project_data(
    raw_data: list[dict],
    owner: str,
    project: int,
    excluded_types: tuple = (),  # By default include everything
) -> list[dict]:
    """Pluck and reformat relevant fields for each item in the raw data."""
    transformed_data = []

    for i, item in enumerate(raw_data):
        try:
            # Validate and parse the raw item
            validated_item = ProjectItem.model_validate(item)

            # Skip excluded issue types
            if validated_item.content.issue_type.name in excluded_types:
                continue

            # Transform into flattened format
            transformed = {
                # project metadata
                "project_owner": owner,
                "project_number": project,
                # issue metadata
                "issue_title": validated_item.content.title,
                "issue_url": validated_item.content.url,
                "issue_parent": validated_item.content.parent.url,
                "issue_type": validated_item.content.issue_type.name,
                "issue_status": validated_item.status.name,
                "issue_is_closed": validated_item.content.closed,
                "issue_opened_at": validated_item.content.created_at,
                "issue_closed_at": validated_item.content.closed_at,
                "issue_points": validated_item.points.number,
                # sprint metadata
                "sprint_id": validated_item.sprint.iteration_id,
                "sprint_name": validated_item.sprint.title,
                "sprint_start": validated_item.sprint.start_date,
                "sprint_length": validated_item.sprint.duration,
                "sprint_end": validated_item.sprint.end_date,
                # roadmap metadata
                "deliverable_pillar": validated_item.pillar.name,
                "quad_id": validated_item.quad.iteration_id,
                "quad_name": validated_item.quad.title,
                "quad_start": validated_item.quad.start_date,
                "quad_length": validated_item.quad.duration,
                "quad_end": validated_item.quad.end_date,
            }
            transformed_data.append(transformed)
        except ValidationError as err:
            logger.error("Error parsing row %d, skipped.", i)  # noqa: TRY400
            logger.debug("Error: %s", err)
            continue

    return transformed_data


def export_sprint_data(
    client: GitHubGraphqlClient,
    owner: str,
    project: int,
    sprint_field: str,
    points_field: str,
) -> list[dict]:
    """Export the issue and project data from a Sprint Board."""
    # Load query
    query_path = PARENT_DIR / "getSprintData.graphql"
    with open(query_path) as f:
        query = f.read()

    # Set query variables
    variables = {
        "login": owner,
        "project": project,
        "sprintField": sprint_field,
        "pointsField": points_field,
    }

    # Execute query
    data = client.execute_paginated_query(
        query,
        variables,
        ["organization", "projectV2", "items"],
    )

    # Transform data
    # And exclude deliverables if they appear on the sprint boards
    # so that we use their status value from the roadmap board instead
    return transform_project_data(
        raw_data=data,
        owner=owner,
        project=project,
        excluded_types=("Deliverable",),
    )




def export_roadmap_data(
    client: GitHubGraphqlClient,
    owner: str,
    project: int,
    quad_field: str,
    pillar_field: str,
) -> list[dict]:
    """Export the issue and project data from a Roadmap Board."""
    # Load query
    query_path = PARENT_DIR / "getRoadmapData.graphql"
    with open(query_path) as f:
        query = f.read()

    # Set query variables
    variables = {
        "login": owner,
        "project": project,
        "quadField": quad_field,
        "pillarField": pillar_field,
    }

    # Execute query
    data = client.execute_paginated_query(
        query,
        variables,
        ["organization", "projectV2", "items"],
    )

    # Transform data
    return transform_project_data(data, owner, project)

    # Write output
