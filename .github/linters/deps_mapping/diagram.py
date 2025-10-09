import re
from dataclasses import dataclass
from enum import StrEnum

from data import Dependency, Issue, issue_slug

STATUS_CLASSES = {
    "In Progress": ":::InProgress",
    "In Review": ":::InProgress",
    "Done": ":::Done",
    "Closed": ":::Done",
}
STATUS_ICONS = {
    "In Progress": "🛠️",
    "In Review": "🛠️",
    "Done": "✔️",
    "Closed": "✔️",
}


# #######################################################
# Templates
# #######################################################


DIAGRAM_TEMPLATE = """
flowchart LR

  %% ─────────────────────────────
  %% Styles
  %% ─────────────────────────────
  classDef default fill:#fff,stroke:#333,stroke-width:1px,color:#000,rx:5,ry:5
  classDef InProgress fill:#e1f3f8,stroke:#07648d,stroke-width:2px,color:#000
  classDef Done fill:#8DE28D,stroke:#204e34,stroke-width:3px,color:#000
  style Canvas fill:transparent,stroke:#171716
  style Legend fill:#F7F7F4,stroke:#171716
{styles}

  %% ─────────────────────────────
  %% Legend
  %% ─────────────────────────────
  subgraph Legend["Key"]
    direction LR
    k1["Todo"]
    k2["In progress 🛠️ "]:::InProgress
    k3["Done ✔️"]:::Done

    k1 -.-> k2 -.-> k3
  end

  %% ─────────────────────────────
  %% Main canvas
  %% ─────────────────────────────
  subgraph Canvas["Dependencies"]
    direction LR

{issues}

    %% ─────────────────────────────
    %% Relationships
    %% ─────────────────────────────
{relationships}

  end
"""

SUBGRAPH_TEMPLATE = """
    subgraph {slug}["{name}"]
    direction LR
{issues}
    end
"""

ISSUE_TEMPLATE = '        {slug}["{title}"]{status_class}'


# #######################################################
# Diagram class
# #######################################################


class Direction(StrEnum):
    """The direction of the dependency."""

    UPSTREAM = "upstream"
    DOWNSTREAM = "downstream"


@dataclass
class Diagram:
    """A diagram of the dependencies between issues."""

    subgraphs: dict[issue_slug, list[Issue]]
    issues: dict[issue_slug, Issue]
    dependencies: list[Dependency]

    def generate_diagram(self, *, group_issues: bool = True) -> str:
        """Generate a diagram of the dependencies between issues.

        Args:
            group_by_subgraphs: If True, group issues by subgraphs. If False,
                               display all issues directly in the canvas.
        """
        return DIAGRAM_TEMPLATE.format(
            styles=self._format_styles(),
            issues=self._format_issues(group_issues),
            relationships=self._format_relationships(),
        )

    def extract_issue_diagram(self, issue_slug: str) -> "Diagram":
        """Extract the dependency diagram for a single issue with full recursive dependencies."""
        if issue_slug not in self.issues:
            return Diagram(subgraphs={}, issues={}, dependencies=[])

        # Get all upstream and downstream dependencies recursively (with dependencies)
        upstream_issues, upstream_deps = self._traverse_dependencies(
            issue_slug=issue_slug,
            direction=Direction.UPSTREAM,
        )
        downstream_issues, downstream_deps = self._traverse_dependencies(
            issue_slug=issue_slug,
            direction=Direction.DOWNSTREAM,
        )

        # Merge all related issues (target + upstream + downstream)
        related_issues = {issue_slug: self.issues[issue_slug]}
        related_issues.update(upstream_issues)
        related_issues.update(downstream_issues)

        # Combine all dependencies found during traversal
        related_dependencies = upstream_deps + downstream_deps

        return Diagram(
            subgraphs={},
            issues=related_issues,
            dependencies=related_dependencies,
        )

    def _traverse_dependencies(
        self,
        issue_slug: str,
        direction: Direction,
    ) -> tuple[dict[str, Issue], list[Dependency]]:
        """Recursively traverse dependencies in the specified direction."""
        issues = {}
        dependencies = []
        visited = set()

        def _traverse(current_issue: str):
            """Recursively traverse dependencies in the specified direction."""
            # If the issue has already been visited, return
            if current_issue in visited:
                return
            visited.add(current_issue)

            # Set up direction-specific logic
            if direction == Direction.UPSTREAM:
                curr_field = "blocked"
                next_field = "blocked_by"
            elif direction == Direction.DOWNSTREAM:
                curr_field = "blocked_by"
                next_field = "blocked"

            # Traverse the dependencies recursively
            for dependency in self.dependencies:
                # Check if the dependency contains the current issue
                issue_in_dep = getattr(dependency, curr_field) == current_issue
                if issue_in_dep:
                    # Get the next issue in the dependency
                    # and check if it exists in the issues dictionary
                    next_issue = getattr(dependency, next_field)
                    # If the next issue doesn't exist in the diagram, skip it
                    if next_issue not in self.issues:
                        continue
                    # Otherwise collect the issue and the dependency
                    issues[next_issue] = self.issues[next_issue]
                    dependencies.append(dependency)
                    # Repeat the process with the next issue
                    _traverse(next_issue)

        _traverse(issue_slug)
        return issues, dependencies

    def _format_styles(self) -> str:
        """Format the subgraph styles."""
        return "\n".join(
            f"  style {format_slug(name)} fill:#F7F7F4,stroke:#171716"
            for name in self.subgraphs
        )

    def _format_issues(self, group_issues: bool = True) -> str:
        """Generate the subgraphs for the 'Canvas' section of the diagram."""
        if group_issues:
            # Generate subgraph structure
            subgraphs = []
            for name, issues in self.subgraphs.items():
                subgraph = SUBGRAPH_TEMPLATE.format(
                    slug=format_slug(name),
                    name=name,
                    issues=format_subgraph_items(issues),
                )
                subgraphs.append(subgraph)
            return "\n".join(subgraphs)
        else:
            # Display all issues directly in the canvas without subgraph grouping
            all_issues = []
            for issue in self.issues.values():
                all_issues.append(issue)
            return format_subgraph_items(all_issues)

    def _format_relationships(self) -> str:
        """Format the subgraph relationships."""
        return "\n".join(
            f"    {dependency.blocked_by} --> {dependency.blocked}"
            for dependency in self.dependencies
        )


# #######################################################
# Helpers
# #######################################################


def format_slug(name: str) -> str:
    """Format a string to a valid slug."""
    # Remove emojis and other non-ASCII characters
    name = re.sub(r"[^\w\s-]", "", name)
    return name.lower().strip().replace(" ", "_")


def format_subgraph_items(issues: list[Issue]) -> str:
    """Format and join the issues for a given subgraph."""
    # Format issue with status styling
    items = []
    for issue in issues:
        if issue.status in STATUS_CLASSES:
            title = f"{issue.title} {STATUS_ICONS[issue.status]}"
            status_class = STATUS_CLASSES[issue.status]
        else:
            title = issue.title
            status_class = ""
        items.append(
            ISSUE_TEMPLATE.format(
                slug=issue.slug,
                title=title,
                status_class=status_class,
            )
        )
    return "\n".join(items)
