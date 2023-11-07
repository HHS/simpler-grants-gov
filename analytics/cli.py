import argparse

from analytics.etl import github

ISSUE_FILE = "data/issue-data.json"
PROJECT_FILE = "data/sprint-data.json"

if __name__ == "__main__":
    # parse arguments passed to the command line
    parser = argparse.ArgumentParser(
        prog="Analytics CLI tool",
        description="Run analytics pipelines from the command line",
    )
    parser.add_argument("--owner")
    parser.add_argument("--repo")
    parser.add_argument("--project")
    # check that the arguments were passed correctly
    args = parser.parse_args()
    for arg in ["owner", "repo", "project"]:
        if not getattr(args, arg):
            raise KeyError(f"{arg} not passed correctly")
    # export the issue and project data
    github.export_issue_data(
        owner=args.owner,
        repo=args.repo,
        output_file=ISSUE_FILE,
    )
    github.export_project_data(
        owner=args.owner,
        project=args.project,
        output_file=PROJECT_FILE,
    )
