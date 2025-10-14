import pathlib

from data import CliArgs
from diagram import Diagram
from utils import DOCS_DIR, err_and_exit, log, update_markdown_section
from .fetch import (
    fetch_issues_from_project,
    fetch_issues_from_repo,
    update_github_issue,
)
from .parse import parse_repo_response, parse_project_response

FILE_PATH = DOCS_DIR / "dependencies.md"

# #######################################################
# Main functions
# #######################################################


def map_issue_dependencies(args: CliArgs) -> None:
    """Parse dependencies for a single issue."""
    # Make the GraphQL request
    diagram = fetch_and_parse_issues_from_repo(args)

    # Update each issue with the dependency diagram
    for issue, issue_data in diagram.issues.items():
        issue_url = f"https://github.com/{issue_data.repo}/issues/{issue_data.number}"
        issue_diagram = diagram.extract_issue_diagram(issue)
        diagram_content = f"""
Here are the upstream and downstream dependencies for this issue:

```mermaid
{issue_diagram.generate_diagram(group_issues=False)}
```
"""
        issue_body = update_markdown_section(
            content=issue_data.body,
            section="Dependencies",
            new_content=diagram_content,
        )
        if args.dry_run:
            log(f"[DRY RUN] Would update GitHub issue {issue_url}")
            log(f"[DRY RUN] New issue body:\n{issue_body}")
            continue
        log(f"Updating GitHub issue {issue_url}")
        update_github_issue(issue_data.repo, issue_data.number, issue_body)


def map_project_dependencies(args: CliArgs) -> None:
    """Parse issue dependencies for a given project."""
    # Make the GraphQL request
    diagram = fetch_and_parse_issues_from_project(args)
    write_diagram_to_file(diagram, FILE_PATH)


def map_repo_dependencies(args: CliArgs) -> None:
    """Parse issue dependencies for a given repository."""
    # Make the GraphQL request
    diagram = fetch_and_parse_issues_from_repo(args)
    write_diagram_to_file(diagram, FILE_PATH)


# #######################################################
# Extract functions
# #######################################################


def fetch_and_parse_issues_from_repo(args: CliArgs) -> Diagram:
    """Fetch and parse issues from a GitHub repository."""
    issues = fetch_issues_from_repo(args)
    return parse_repo_response(issues, args)


def fetch_and_parse_issues_from_project(args: CliArgs) -> Diagram:
    """Fetch and parse issues from a GitHub project."""
    issues = fetch_issues_from_project(args)
    return parse_project_response(issues, args)


# #######################################################
# Write functions
# #######################################################


def write_diagram_to_file(
    diagram: Diagram,
    file_path: pathlib.Path,
) -> None:
    """Write the diagram to the README file, updating the dependency graph section."""
    try:
        # Read the current README content
        with open(file_path, "r", encoding="utf-8") as f:
            readme_content = f.read()

        # Generate the diagram content
        section_content = f"""
Here are the dependencies amongst deliverables:

```mermaid
{diagram.generate_diagram()}
```
"""

        # Update the dependency graph section
        updated_content = update_markdown_section(
            content=readme_content,
            section="Dependency diagram",
            new_content=section_content,
            level=2,
        )

        # Write the updated content back to the README
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(updated_content)

        log(f"Successfully updated {file_path} with dependency diagram")

    except FileNotFoundError:
        err_and_exit(f"README file not found: {file_path}")
    except Exception as e:
        err_and_exit(f"Failed to update {file_path}: {e}")
