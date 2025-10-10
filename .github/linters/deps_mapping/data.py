from dataclasses import dataclass, field


issue_slug = str


@dataclass
class CliArgs:
    """Command line arguments for the application."""

    scope: str
    org: str
    repo: str
    project: int
    issue_type: str
    labels: list[str] | None = None
    statuses: list[str] = field(default_factory=list)
    batch: int = 100
    dry_run: bool = False


@dataclass
class Issue:
    """An issue from the GitHub API."""

    slug: issue_slug
    repo: str
    number: int
    title: str
    body: str = ""
    status: str = ""
    group: str = "Other"


@dataclass
class Dependency:
    """A dependency between two issues."""

    blocked: issue_slug
    blocked_by: issue_slug
