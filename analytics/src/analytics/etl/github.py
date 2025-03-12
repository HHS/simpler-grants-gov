"""Extract and transform GitHub data to create the `GitHubIssues` dataset."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import pandas as pd
from pydantic import BaseModel, ValidationError

from analytics.datasets.acceptance_criteria import AcceptanceCriteriaDataset

from analytics.datasets.issues import (
    GitHubIssues,
    IssueMetadata,
    IssueType,
)
from analytics.datasets.utils import load_json_file
from analytics.integrations import github


logger = logging.getLogger(__name__)

# ========================================================
# Config interfaces
# ========================================================


@dataclass
class InputFiles:
    """Expected input files for loading this dataset."""

    roadmap: str
    sprint: str


class GitHubProjectConfig(BaseModel):
    """Configurations for GitHub projects ETL."""

    roadmap_project: RoadmapConfig
    sprint_projects: list[SprintBoardConfig]
    temp_dir: str = "data"
    output_file: str = "data/delivery-data.json"


class RoadmapConfig(BaseModel):
    """
    Configuration details for a roadmap project.

    Attributes
    ----------
    owner
        The GitHub login for the project owner.
    project_number
        The number of the project.
    quad_field
        The name of the project field that stores the Quad value for a deliverable.
    pillar_field
        The name of the project field that stores the Pillar value for a deliverable.

    """

    owner: str
    project_number: int
    quad_field: str = "Quad"
    pillar_field: str = "Pillar"


class SprintBoardConfig(BaseModel):
    """
    Configuration details for a sprint board project.

    Attributes
    ----------
    owner
        The GitHub login for the project owner.
    number
        The number of the project.
    points_field
        The name of the project field that stores story points or estimates.
    sprint_field
        The name of the project field that stores the sprint value.

    """

    owner: str
    project_number: int
    points_field: str = "Points"
    sprint_field: str = "Sprint"


# ========================================================
# ETL pipeline
# ========================================================


class GitHubProjectETL:
    """Manage the ETL pipeline for GitHub project data."""

    def __init__(self, config: GitHubProjectConfig) -> None:
        """Initialize and run the ETL pipeline for Github project data."""
        # Store the config
        self.config = config
        # Declare private attributes shared across ETL steps
        self._transient_files: list[InputFiles]
        self.client = github.GitHubGraphqlClient()
        self.dataset: GitHubIssues

    def run(self) -> None:
        """Run the ETL pipeline."""
        self.extract()
        self.transform()
        self.write_to_file()

    def extract(self) -> None:
        """Run the extract step of the ETL pipeline."""
        temp_dir = Path(self.config.temp_dir)

        # Export the roadmap data
        roadmap_file_path = str(temp_dir / "roadmap-data.json")
        roadmap = self.config.roadmap_project
        self._export_roadmap_data_to_file(
            roadmap=roadmap,
            output_file_path=roadmap_file_path,
        )

        # Export sprint data for each GitHub project that the scrum teams use
        # to manage their sprints, e.g. HHS/17 and HHS/13
        input_files: list[InputFiles] = []
        for sprint_board in self.config.sprint_projects:
            n = sprint_board.project_number
            sprint_file_path = str(temp_dir / f"sprint-data-{n}.json")
            self._export_sprint_data_to_file(
                sprint_board=sprint_board,
                output_file_path=sprint_file_path,
            )
            # Add to file list
            input_files.append(
                InputFiles(
                    roadmap=roadmap_file_path,
                    sprint=sprint_file_path,
                ),
            )
        # store transient files for re-use during the transform step
        self._transient_files = input_files

    def transform(self) -> None:
        """Transform exported data and write to file."""
        # Load sprint and roadmap data
        issues = []
        for f in self._transient_files:
            issues.extend(run_transformation_pipeline(files=f))
        self.dataset = GitHubIssues(pd.DataFrame(data=issues))

    def write_to_file(self) -> None:
        """Dump dataset to file."""
        self.dataset.to_json(self.config.output_file)

    def _export_roadmap_data_to_file(
        self,
        roadmap: RoadmapConfig,
        output_file_path: str,
    ) -> None:

        logger.info(
            "Exporting roadmap data from %s/%d",
            roadmap.owner,
            roadmap.project_number,
        )
        github.export_roadmap_data_to_file(
            client=self.client,
            owner=roadmap.owner,
            project=roadmap.project_number,
            quad_field=roadmap.quad_field,
            pillar_field=roadmap.pillar_field,
            output_file=output_file_path,
        )

    def _export_sprint_data_to_file(
        self,
        sprint_board: SprintBoardConfig,
        output_file_path: str,
    ) -> None:

        logger.info(
            "Exporting sprint data from %s/%d",
            sprint_board.owner,
            sprint_board.project_number,
        )
        github.export_sprint_data_to_file(
            client=self.client,
            owner=sprint_board.owner,
            project=sprint_board.project_number,
            sprint_field=sprint_board.sprint_field,
            points_field=sprint_board.points_field,
            output_file=output_file_path,
        )

    def extract_and_transform_in_memory(self) -> list[dict]:
        """Export from GitHub and transform to JSON."""
        # export roadmap data
        roadmap = self.config.roadmap_project
        roadmap_json = github.export_roadmap_data_to_object(
            client=self.client,
            owner=roadmap.owner,
            project=roadmap.project_number,
            quad_field=roadmap.quad_field,
            pillar_field=roadmap.pillar_field,
        )

        # extract acceptance criteria from roadmap json
        deliverable_json = [d for d in roadmap_json if d["issue_type"] == "Deliverable"]
        _ = AcceptanceCriteriaDataset.load_from_json_object(
            json_data=deliverable_json,
        )
        # TO DO: include a.c. in function output

        # export sprint data
        issues = []
        for sprint_board in self.config.sprint_projects:
            sprint_json = github.export_sprint_data_to_object(
                client=self.client,
                owner=sprint_board.owner,
                project=sprint_board.project_number,
                sprint_field=sprint_board.sprint_field,
                points_field=sprint_board.points_field,
            )

            # flatten sprint and roadmap data into issue data
            issues.extend(
                run_transformation_pipeline_on_json(
                    roadmap=roadmap_json,
                    sprint=sprint_json,
                ),
            )

        # hydrate issue dataset
        dataset = GitHubIssues(pd.DataFrame(data=issues))

        # dump issue dataset to JSON
        return dataset.to_dict()


# ===============================================================
# Transformation helper functions
# ===============================================================


def run_transformation_pipeline(files: InputFiles) -> list[dict]:
    """Load data from input files and apply transformations."""
    # Log the current sprint for which we're running the transformations
    logger.info("Running transformations for sprint: %s", files.sprint)
    # Load sprint and roadmap data
    sprint_data_in = load_json_file(files.sprint)
    roadmap_data_in = load_json_file(files.roadmap)
    # Populate a lookup table with this data
    lookup: dict = {}
    lookup = populate_issue_lookup_table(lookup, roadmap_data_in)
    lookup = populate_issue_lookup_table(lookup, sprint_data_in)
    # Flatten and write issue level data to output file
    return flatten_issue_data(lookup)


def run_transformation_pipeline_on_json(
    roadmap: list[dict],
    sprint: list[dict],
) -> list[dict]:
    """Apply transformations."""
    # Populate a lookup table with this data
    lookup: dict = {}
    lookup = populate_issue_lookup_table(lookup, roadmap)
    lookup = populate_issue_lookup_table(lookup, sprint)
    # Flatten and write issue level data to output file
    return flatten_issue_data(lookup)


def populate_issue_lookup_table(
    lookup: dict[str, IssueMetadata],
    issues: list[dict],
) -> dict[str, IssueMetadata]:
    """Populate a lookup table that maps issue URLs to their issue type and parent."""
    for i, issue in enumerate(issues):
        try:
            entry = IssueMetadata.model_validate(issue)
        except ValidationError as err:
            logger.info(
                "Skipping issue %d: %s.",
                i,
                err,
            )
            logger.debug("Error: %s", err)
            continue
        lookup[entry.issue_url] = entry
    return lookup


def get_parent_with_type(
    child_url: str,
    lookup: dict[str, IssueMetadata],
    type_wanted: IssueType,
) -> IssueMetadata | None:
    """
    Traverse the lookup table to find an issue's parent with a specific type.

    This is useful if we have multiple nested issues, and we want to find the
    top level deliverable or epic that a given task or bug is related to.
    """
    # Get the initial child issue and its parent (if applicable) from the URL
    child = lookup.get(child_url)
    if not child:
        err = f"Lookup doesn't contain issue with url: {child_url}"
        raise ValueError(err)
    if not child.issue_parent:
        return None

    # Travel up the issue hierarchy until we:
    #  - Find a parent issue with the desired type
    #  - Get to an issue without a parent
    #  - Have traversed 5 issues (breaks out of issue cycles)
    max_traversal = 5
    parent_url = child.issue_parent
    for _ in range(max_traversal):
        parent = lookup.get(parent_url)
        # If no parent is found, return None
        if not parent:
            return None
        # If the parent matches the desired type, return it
        if IssueType(parent.issue_type) == type_wanted:
            return parent
        # If the parent doesn't have a its own parent, return None
        if not parent.issue_parent:
            return None
        # Otherwise update the parent_url to "grandparent" and continue
        parent_url = parent.issue_parent

    # Return the URL of the parent deliverable (or None)
    return None


def flatten_issue_data(lookup: dict[str, IssueMetadata]) -> list[dict]:
    """Flatten issue data and inherit data from parent epic an deliverable."""
    result: list[dict] = []
    for issue in lookup.values():
        # If the issue is a deliverable or epic, move to the next one
        if IssueType(issue.issue_type) in [IssueType.DELIVERABLE, IssueType.EPIC]:
            continue

        # Get the parent deliverable, if the issue has one
        deliverable = get_parent_with_type(
            child_url=issue.issue_url,
            lookup=lookup,
            type_wanted=IssueType.DELIVERABLE,
        )
        if deliverable:
            # Set deliverable metadata
            issue.deliverable_title = deliverable.issue_title
            issue.deliverable_url = deliverable.issue_url
            issue.deliverable_pillar = deliverable.deliverable_pillar
            issue.deliverable_status = deliverable.issue_status
            # Set quad metadata
            issue.quad_id = deliverable.quad_id
            issue.quad_name = deliverable.quad_name
            issue.quad_start = deliverable.quad_start
            issue.quad_end = deliverable.quad_end
            issue.quad_length = deliverable.quad_length

        # Get the parent epic, if the issue has one
        epic = get_parent_with_type(
            child_url=issue.issue_url,
            lookup=lookup,
            type_wanted=IssueType.EPIC,
        )
        if epic:
            issue.epic_title = epic.issue_title
            issue.epic_url = epic.issue_url

        # Add the issue to the results
        result.append(issue.model_dump())

    # Return the results
    return result
