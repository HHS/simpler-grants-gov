"""Extract and transform GitHub data to create the `GitHubIssues` dataset."""

from __future__ import annotations

import logging
from pathlib import Path

from pydantic import BaseModel

from analytics.datasets.issues import GitHubIssues, InputFiles
from analytics.integrations import github

logger = logging.getLogger(__name__)

# ========================================================
# Config interfaces
# ========================================================


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
        self._dataset: GitHubIssues

    def run(self) -> None:
        """Run the ETL pipeline."""
        self.extract()
        self.transform()
        self.load()

    def extract(self) -> None:
        """Run the extract step of the ETL pipeline."""
        temp_dir = Path(self.config.temp_dir)

        # Export the roadmap data
        roadmap_file = str(temp_dir / "roadmap-data.json")
        roadmap = self.config.roadmap_project
        self._export_roadmap_data(
            roadmap=roadmap,
            output_file=roadmap_file,
        )

        # Export sprint data
        input_files: list[InputFiles] = []
        for sprint_board in self.config.sprint_projects:
            project = sprint_board.project_number
            sprint_file = str(temp_dir / f"sprint-data-{project}.json")
            # Export data
            self._export_sprint_data(
                sprint_board=sprint_board,
                output_file=sprint_file,
            )
            # Add to file list
            input_files.append(
                InputFiles(
                    roadmap=roadmap_file,
                    sprint=sprint_file,
                ),
            )
        # store transient files for re-use during the transform step
        self.transient_files = input_files

    def transform(self) -> None:
        """Run the transformation step of the ETL pipeline."""
        self._dataset = GitHubIssues.load_from_json_files(self.transient_files)

    def load(self) -> None:
        """Run the load step of the ETL pipeline."""
        self._dataset.to_json(self.config.output_file)

    def _export_roadmap_data(
        self,
        roadmap: RoadmapConfig,
        output_file: str,
    ) -> None:
        """Export data from the roadmap project."""
        # Log the export step
        logger.info(
            "Exporting roadmap data from %s/%d",
            roadmap.owner,
            roadmap.project_number,
        )
        # Export the data
        github.export_roadmap_data(
            owner=roadmap.owner,
            project=roadmap.project_number,
            quad_field=roadmap.quad_field,
            pillar_field=roadmap.pillar_field,
            output_file=output_file,
        )

    def _export_sprint_data(
        self,
        sprint_board: SprintBoardConfig,
        output_file: str,
    ) -> None:
        """Export data from a sprint board project."""
        logger.info(
            "Exporting sprint data from %s/%s",
            sprint_board.owner,
            sprint_board.project_number,
        )
        github.export_sprint_data(
            owner=sprint_board.owner,
            project=sprint_board.project_number,
            sprint_field=sprint_board.sprint_field,
            points_field=sprint_board.points_field,
            output_file=output_file,
        )
