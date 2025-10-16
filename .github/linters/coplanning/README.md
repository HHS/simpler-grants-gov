# Syncing Co-planning data between GitHub and Fider

This script syncs data between GitHub and Fider for the Co-planning project.

## Usage

This CLI script supports two major syncing workflows:

- **GitHub to Fider:** Populate the Fider board with the latest GitHub issues
- **Fider to GitHub:** Update the GitHub issue description with a link to the Fider post and the vote count

### Syncing GitHub to Fider

To populate the Fider board with GitHub issues that have the label `Coplanning Proposal`, you can manually trigger the "Co-planning: Sync GitHub to Fider" workflow.

Behind the scenes this workflow makes the following CLI call:

```bash
python run.py \
    --org "HHS" \
    --repo "simpler-grants-gov" \
    --label "Coplanning Proposal" \
    --issue-sections "Summary" \
    --issue-sections "Problem Statement" \
    --issue-sections "Proposed Solution" \
    --issue-sections "Success Criteria" \
    --issue-sections "Additional Context" \
    --platform "fider" \
    --sync-direction "github-to-platform" \
    --update-existing
```

### Syncing Fider to GitHub

By default, this workflow will run once a day at 12:00 AM UTC. You can manually trigger the "Co-planning: Sync Fider to GitHub" workflow to update the GitHub issue description with the Fider post description and the vote count.

Behind the scenes this workflow makes the following CLI call. Note that it's basically the same as the GitHub to Fider sync workflow but with the sync direction reversed (i.e. `platform-to-github`).

```bash
python run.py \
    --org "HHS" \
    --repo "simpler-grants-gov" \
    --label "Coplanning Proposal" \
    --issue-sections "Summary" \
    --issue-sections "Problem Statement" \
    --issue-sections "Proposed Solution" \
    --issue-sections "Success Criteria" \
    --issue-sections "Additional Context" \
    --platform "fider" \
    --sync-direction "platform-to-github"
```

## Configuring the sync behavior

The CLI supports the following options:

- `--org`: The GitHub organization that owns the repository
- `--repo`: The GitHub repository to sync data from
- `--label`: The GitHub issue label to sync data from
- `--state`: The GitHub issue state to sync data from (e.g. `open`, `closed`, `all`), defaults to `open`
- `--batch`: The number of issues to sync at a time, defaults to `100` which is the max batch size for the GitHub API
- `--issue-sections`: The sections of the GitHub issue body to use for the Fider post description. Can be specified multiple times, or can receive multiple string arguments. When passing multiple arguments, each needs to be enclosed in quotes. For example:
  ```bash
  --issue-sections "Summary" "Problem Statement" "Proposed Solution" "Success Criteria" "Additional Context"
  ```
- `--platform`: The platform to sync to (currently only `fider` is supported) but it could be extended to other platforms in the future
- `--sync-direction`: The direction of the sync `github-to-platform` or `platform-to-github`
- `--update-existing`: Whether to update existing posts on the platform with the latest GitHub issue data
- `--dry-run`: Whether to run the sync in dry run mode (e.g. log the insert or update but don't actually perform them)
