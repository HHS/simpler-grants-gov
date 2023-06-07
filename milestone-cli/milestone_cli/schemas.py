"""Defines the data interfaces for milestone details"""
from pydantic import BaseModel


class MilestoneBase(BaseModel):
    """Contains fields shared by Milestone and Section

    Attributes:
        heading: The heading as it will appear in the summary markdown doc
        description: The description as it will appear in the summary markdown doc
        diagram_name: The name as it will appear in the mermaid diagram
    """

    heading: str
    description: str
    diagram_name: str


class Milestone(MilestoneBase):
    """Contains a summary of details about a project milestone

    Attributes:
        status: The status of the milestone, which appears in the summary doc and
            determines the styling applied to the node in the mermaid diagram
        dependencies: A list of the upstream dependencies for this milestone
    """

    status: str | None = None
    dependencies: list[str] | None = None


class MilestoneSection(MilestoneBase):
    """Represents a group of project milestones

    Attributes:
        milestones: The list of milestones that fall under this section
    """

    milestones: dict[str, Milestone]


class Dependency(BaseModel):
    """Documents a (downstream) milestone's dependency on an upstream milestone

    Attributes:
        upstream: The milestone that the downstream milestone depends on
        downstream: The downstream milestone that is blocked by the upstream milestone
    """

    upstream: Milestone
    downstream: Milestone

    def jinja_export(self) -> dict:
        """Export just the diagram names for jinja templating

        Returns:
            A dictionary of the diagram names for upstream and downstream dependencies
        """
        return {
            "upstream": self.upstream.diagram_name,
            "downstream": self.downstream.diagram_name,
        }


class MilestoneSummary(BaseModel):
    """Stores the list of milestones and the sections they belong to

    Attributes:
        version: Version of the milestone summary pulled from the yaml file
        sections: A dictionary that maps MilestoneSections to their keys
    """

    version: str
    sections: dict[str, MilestoneSection]

    def map_dependencies(self, milestone: Milestone) -> list[Dependency] | None:
        """Split milestone dependencies into a list of Dependency objects

        Args:
            milestone: A Milestone object to map dependencies for

        Returns:
            A list of Dependency objects for the given Milestone if it has
            upstream depdencies, None otherwise
        """
        if not milestone.dependencies:
            return None
        deps = []
        for parent in milestone.dependencies:
            upstream = self.milestones.get(parent)
            if not upstream:
                # TODO: Change to custom error type
                raise KeyError(f"'{parent}' not found in list of milestones")
            deps.append(Dependency(upstream=upstream, downstream=milestone))
        return deps

    @property
    def dependencies(self) -> list[Dependency]:
        """Returns a list of Dependency objects across all milestones"""
        results = []
        for milestone in self.milestones.values():
            dependencies = self.map_dependencies(milestone)
            if dependencies:
                results.extend(dependencies)
        return results

    @property
    def milestones(self) -> dict[str, Milestone]:
        """Returns a combined dictionary of Milestone objects mapped to their key"""
        return {
            milestone: details
            for section in self.sections.values()
            for milestone, details in section.milestones.items()
        }

    def export_jinja_params(self) -> dict:
        """Exports sections and milestones for use in jinja templates"""
        return {
            **self.dict(),
            "dependencies": [dep.jinja_export() for dep in self.dependencies],
        }
