"""
Sync Co-planning data between GitHub and a feature voting platform like Fider.

Usage: From the root of the coplanning/ directory:
  python run.py \
    --org HHS \
    --repo simpler-grants-gov \
    --label "Coplanning Proposal" \
    --issue-sections "Summary" \
    --issue-sections "Problem Statement" \
    --issue-sections "Proposed Solution" \
    --issue-sections "Success Criteria" \
    --issue-sections "Additional Context" \
    --platform fider \
    --sync-direction github-to-platform \
    --update-existing \
    --dry-run
"""

import argparse
from dataclasses import dataclass

import fider
import github
from utils import log

# #######################################################
# CLI Argument Parsing
# #######################################################


@dataclass
class CliArgs:
    """Command line arguments for the application."""

    org: str
    repo: str
    label: str
    issue_sections: list[str]
    platform: str
    sync_direction: str = "github-to-platform"
    state: str = "open"
    batch: int = 100
    update_existing: bool = False
    dry_run: bool = False


def parse_args() -> CliArgs:
    """Parse command line arguments and return a CliArgs dataclass."""
    parser = argparse.ArgumentParser(
        description="Load GitHub issues into Fider or FeatureBase board"
    )
    parser.add_argument("--org", required=True, help="GitHub organization")
    parser.add_argument("--repo", required=True, help="GitHub repository")
    parser.add_argument("--label", required=True, help="GitHub issue label")
    parser.add_argument(
        "--issue-sections",
        required=True,
        action="append",
        help="GitHub issue sections to use for post description (can be specified multiple times)",
    )
    parser.add_argument(
        "--sync-direction",
        required=True,
        choices=["github-to-platform", "platform-to-github"],
        help="Sync direction (github-to-platform or platform-to-github)",
    )
    parser.add_argument(
        "--platform",
        required=True,
        choices=["fider", "featurebase"],
        help="Platform to use (fider or featurebase)",
    )
    parser.add_argument("--state", default="open", help="GitHub issue state")
    parser.add_argument("--batch", type=int, default=100, help="Batch size")
    parser.add_argument(
        "--update-existing",
        action="store_true",
        help="Update the description and title of existing posts on the platform",
    )
    parser.add_argument("--dry-run", action="store_true", help="Dry run mode")

    args = parser.parse_args()
    return CliArgs(
        org=args.org,
        repo=args.repo,
        label=args.label,
        issue_sections=args.issue_sections,
        platform=args.platform,
        sync_direction=args.sync_direction,
        state=args.state,
        batch=args.batch,
        update_existing=args.update_existing,
        dry_run=args.dry_run,
    )


# #######################################################
# Fider Operations
# #######################################################


def sync_github_to_fider(args: CliArgs) -> None:
    """Fetch GitHub issues and use them to populate a Fider board."""
    # Fetch GitHub issues
    github_issues = github.fetch_github_issues(
        org=args.org,
        repo=args.repo,
        label=args.label,
        state=args.state,
        batch=args.batch,
    )

    # Fetch Fider posts
    fider_posts = fider.fetch_posts()

    # Check which GitHub issues need to be added
    log("Checking which GitHub issues need to be added or updated in Fider")
    log(f"Update existing: {args.update_existing}")
    fider.upsert_posts(
        github_issues=github_issues,
        fider_posts=fider_posts,
        issue_sections=args.issue_sections,
        update_existing=args.update_existing,
        dry_run=args.dry_run,
    )


def sync_fider_to_github(args: CliArgs) -> None:
    """Fetch posts from Fider and use them to update issues in GitHub."""
    # Fetch Fider posts
    fider_posts = fider.fetch_posts()

    # Extract GitHub issues
    github_issues = github.fetch_github_issues(
        org=args.org,
        repo=args.repo,
        label=args.label,
        state=args.state,
        batch=args.batch,
    )

    # Update GitHub issues based on Fider posts
    log("Updating GitHub issues based on Fider posts")
    github.update_github_issues(
        issues=github_issues,
        posts=fider_posts,
        dry_run=args.dry_run,
    )


# #######################################################
# Main
# #######################################################


def main() -> int:
    args = parse_args()

    if args.dry_run:
        log("Running in dry run mode")

    if args.sync_direction == "github-to-platform":
        sync_github_to_fider(args)
    elif args.sync_direction == "platform-to-github":
        sync_fider_to_github(args)

    return 0  # success


if __name__ == "__main__":
    exit(main())
