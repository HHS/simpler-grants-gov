"""
Map dependencies amongst GitHub issues using a mermaid diagram.

Usage: From the root of the deps_mapping/ directory:
  python run.py \
    --scope "issue" \
    --org "HHS" \
    --repo "simpler-grants-protocol" \
    --project 17 \
    --issue-type "Epic" \
    --label "Co-planning" \
    --state "open" \
    --dry-run
"""

import argparse

import github
from data import CliArgs
from utils import log

# #######################################################
# CLI Argument Parsing
# #######################################################


def parse_args() -> CliArgs:
    """Parse command line arguments and return a CliArgs dataclass."""
    parser = argparse.ArgumentParser(
        description="Map dependencies amongst GitHub issues using a mermaid diagram"
    )
    parser.add_argument(
        "--scope",
        required=True,
        choices=["issue", "repo"],
        help="Scope of the dependencies to map",
    )
    parser.add_argument("--org", required=True, help="GitHub organization")
    parser.add_argument("--repo", required=True, help="GitHub repository")
    parser.add_argument(
        "--project",
        type=int,
        required=True,
        help="GitHub project number",
    )
    parser.add_argument("--issue-type", required=True, help="GitHub issue type")
    parser.add_argument(
        "--labels",
        action="append",
        help="GitHub issue label, can be specified multiple times",
    )
    parser.add_argument(
        "--statuses",
        action="append",
        help="GitHub issue status, can be specified multiple times",
    )
    parser.add_argument("--batch", type=int, default=100, help="Batch size")
    parser.add_argument("--dry-run", action="store_true", help="Dry run mode")

    args = parser.parse_args()
    return CliArgs(
        scope=args.scope,
        org=args.org,
        repo=args.repo,
        project=args.project,
        issue_type=args.issue_type,
        labels=args.labels,
        statuses=args.statuses,
        batch=args.batch,
        dry_run=args.dry_run,
    )


# #######################################################
# Main
# #######################################################


def main() -> int:
    args = parse_args()

    if args.dry_run:
        log("Running in dry run mode")

    if args.scope == "issue":
        github.map_issue_dependencies(args)
    elif args.scope == "repo":
        github.map_repo_dependencies(args)
    return 0  # success


if __name__ == "__main__":
    exit(main())
