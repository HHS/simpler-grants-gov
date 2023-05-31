from pydantic import BaseModel


class MilestoneBase(BaseModel):
    """Contains fields shared by Milestone and Section"""

    heading: str
    diagram_name: str
    description: str


class Milestone(MilestoneBase):
    """Contains a summary of details about a project milestone"""

    status: str | None = None
    dependencies: list[str] | None = None


class MilestoneSection(MilestoneBase):
    """Represents a group of project milestones"""

    milestones: dict[str, Milestone]


class Dependency(BaseModel):
    """Documents a (downstream) milestone's dependency on an upstream milestone"""

    upstream: Milestone
    downstream: Milestone

    def jinja_export(self) -> dict:
        """Export just the diagram names for jinja templating"""
        return {
            "upstream": self.upstream.diagram_name,
            "downstream": self.downstream.diagram_name,
        }


class MilestoneSummary(BaseModel):
    """Stores the list of milestones and the sections they belong to"""

    version: str
    sections: dict[str, MilestoneSection]

    def map_dependencies(self, milestone: Milestone) -> list[Dependency] | None:
        """Split milestone dependencies into a list of Dependency objects"""
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
        """Returns a combined list of Milestone objects"""
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
