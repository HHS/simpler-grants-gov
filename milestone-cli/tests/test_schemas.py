from copy import deepcopy
import pytest

from milestone_cli.schemas import (
    Dependency,
    Milestone,
    MilestoneSection,
    MilestoneSummary,
)


@pytest.fixture(scope="module", name="summary")
def summary_fixture():
    """Creates a sample MilestoneSummary fixture for tests"""
    sections = {
        "project-goals": MilestoneSection(
            heading="Project Goals",
            diagram_name="Project Goals",
            description="Project goals description",
            milestones={
                "define-goals": Milestone(
                    heading="Define Goals",
                    diagram_name="Define-Goals",
                    description="Goals description",
                    status="executing",
                ),
                "measurement-strategy": Milestone(
                    key="measurement-strategy",
                    heading="Measurement Strategy",
                    diagram_name="Measurement-Strategy",
                    description="Measurement description",
                    status="executing",
                    dependencies=["define-goals"],
                ),
            },
        ),
        "communications-tooling": MilestoneSection(
            heading="Communications tooling",
            diagram_name="Communications Tooling",
            description="Project goals description",
            milestones={
                "comms-platform": Milestone(
                    heading="Communications Platform",
                    diagram_name="Comms-Platform",
                    description="Comms platform description",
                    status="planning",
                    section="communications-tooling",
                    dependencies=["define-goals", "measurement-strategy"],
                ),
            },
        ),
    }
    return MilestoneSummary(version="0.1.0", sections=sections)


class TestDependencies:
    """Tests the MilestoneSummary.dependencies hybrid property"""

    def test_returns_list_of_dependency_objects(
        self,
        summary: MilestoneSummary,
    ) -> None:
        """Should return a list of Depdency objects"""
        # execution
        output = summary.dependencies
        # validation
        assert isinstance(output[0], Dependency)

    def test_returns_correct_dependencies(
        self,
        summary: MilestoneSummary,
    ) -> None:
        """Should return a separate Dependency object for each dependency"""
        # setup
        goals = summary.milestones.get("define-goals")
        measure = summary.milestones.get("measurement-strategy")
        comms = summary.milestones.get("comms-platform")
        expected = [
            Dependency(upstream=goals, downstream=measure),
            Dependency(upstream=goals, downstream=comms),
            Dependency(upstream=measure, downstream=comms),
        ]
        # execution
        output = summary.dependencies
        # validation
        assert len(output) == len(expected)
        for dependency in expected:
            assert dependency in output

    def test_return_empty_list_if_no_deps(
        self,
        summary: MilestoneSummary,
    ) -> None:
        """Should return None if none of the milestones have dependencies"""
        # setup - Set all dependencies to None
        new_summary = deepcopy(summary)
        for milestone in new_summary.milestones.values():
            milestone.dependencies = None
        # execution
        output = new_summary.dependencies
        # validation
        assert output == []


@pytest.fixture(scope="class", name="params")
def jinja_params_fixture(summary: MilestoneSummary) -> dict:
    """Export the summary once for the duration of the class"""
    return summary.export_jinja_params()


class TestExportJinjaParams:
    """Tests the MilestoneSummary.export_jinja_params() method"""

    def test_includes_dependencies_for_diagram(
        self,
        params: dict,
        summary: MilestoneSummary,
    ) -> None:
        """"""
        # setup
        dependencies = params.get("dependencies")
        expected = {
            "upstream": "Define-Goals",
            "downstream": "Measurement-Strategy",
        }
        # validation
        assert len(dependencies) == len(summary.dependencies)
        assert dependencies[0] == expected
