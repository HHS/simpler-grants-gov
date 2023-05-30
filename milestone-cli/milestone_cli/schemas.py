from pydantic import BaseModel


class MilestoneBase(BaseModel):
    """Contains fields shared by Milestone and Section"""

    heading: str
    diagram_name: str
    description: str
    key: str | None = None


class Milestone(MilestoneBase):
    """Contains a summary of details about a project milestone"""

    status: str | None = None
    section: str | None = None
    dependencies: list[str] | None = None


class MilestoneSection(MilestoneBase):
    """Represents a group of project milestones"""

    milestones: dict[str, Milestone]


class Dependency(BaseModel):
    """Documents a (downstream) milestone's dependency on an upstream milestone"""

    upstream: Milestone
    downstream: Milestone


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
                raise KeyError  # TODO: Change to custom error type
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
