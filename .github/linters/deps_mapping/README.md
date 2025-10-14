# Dependency Mapping

This script generates a mermaid diagram of the dependencies between issues in a GitHub repository based on the ["Blocked by" and "Blocking"](https://github.blog/changelog/2025-08-21-dependencies-on-issues/#%e2%9e%95-getting-started) relationships feature.

## Usage

### Mapping dependencies for all deliverables

This will generate a diagram of the dependencies between all deliverables in the repository with a specific issue type, then update the [`documentation/dependencies.md`](../../../documentation/dependencies.md) file with the diagram.

```bash
python run.py \
    --org HHS \
    --repo simpler-grants-gov \
    --project 12 \
    --issue-type "Deliverable" \
    --statuses "Prioritized" \
    --statuses "Planning" \
    --statuses "In Progress" \
    --statuses "Done" \
    --scope repo
```

### Mapping dependencies for a single deliverable

This will generate a diagram of the dependencies upstream and downstream of a specific deliverable, and post the diagram to the "Dependencies" section within each issue's body.

```bash
python run.py \
    --org HHS \
    --repo simpler-grants-gov \
    --project 12 \
    --issue-type "Deliverable" \
    --statuses "Prioritized" \
    --statuses "Planning" \
    --statuses "In Progress" \
    --statuses "Done" \
    --scope issue
```

## Configuring the sync behavior

The CLI supports the following options:

- `--org`: The GitHub organization that owns the repository
- `--repo`: The GitHub repository to fetch issues from
- `--project`: The GitHub project to use for issue status
- `--issue-type`: The GitHub issue type to include in the dependency mapping
- `--statuses`: The GitHub issue status to include in the dependency mapping, can be specified multiple times
- `--batch`: The number of issues to fetch at a time, defaults to `100` which is the max batch size for the GitHub API
- `--scope`: The scope of the dependencies to map (`issue` or `repo`)
- `--dry-run`: Whether to run the mapping in dry run mode (e.g. log the GitHub updates but don't actually perform them)

## Local development

Before running the script locally, you need to set the `GITHUB_API_TOKEN` environment variable.

```bash
python run.py \
    --org "HHS" \
    --repo "simpler-grants-gov" \
    --project 12 \
    --issue-type "Deliverable" \
    --statuses "Prioritized" \
    --statuses "Planning" \
    --statuses "In Progress" \
    --statuses "Done" \
    --scope issue
```

You can also run the script with the `--dry-run` flag to see what would be done without actually performing the actions.
