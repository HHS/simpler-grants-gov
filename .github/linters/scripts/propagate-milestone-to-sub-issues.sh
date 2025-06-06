#!/usr/bin/env bash
##
# This script inherits the milestone from the parent issue to the child issue.
# It uses the GitHub CLI to fetch the issue and parent milestone details,
# and then updates the issue milestone to match the parent's milestone.
#
# Usage: ./propagate-milestone-to-sub-issues.sh [--dry-run] <issue-url>

set -euo pipefail

log() { echo "[info] $1"; }
err() { echo "[error] $1" >&2; exit 1; }

# #######################################################
# Parse command line arguments
# #######################################################

dry_run=false
issue_url=""

while [[ $# -gt 0 ]]; do
  case $1 in
    -d|--dry-run)
      dry_run=true
      shift
      ;;
    *)
      issue_url="$1"
      shift
      ;;
  esac
done

if [[ -z "$issue_url" ]]; then
  echo "Usage: $0 [--dry-run] <issue-url>"
  exit 1
fi

log "Issue URL: $issue_url"
if [[ "$dry_run" == "true" ]]; then
  log "Dry run mode enabled - no changes will be made"
fi

# #######################################################
# Pluck a field from a JSON object
# #######################################################

pluck_field() {
  local json_data="$1"
  local field_path="$2"
  local default_value="${3:-}"
  jq -r "$field_path" <<< "$json_data"
}

# #######################################################
# Define the GraphQL query
# #######################################################

graphql_query='
query($url: URI!) {
  resource(url: $url) {
    ... on Issue {
      number
      repository { nameWithOwner }
      milestone { number title }
      subIssues: subIssues(first: 100) {
        nodes {
          ... on Issue {
            number
            repository { nameWithOwner }
            milestone { number title }
          }
        }
      }
    }
  }
}
'

# #######################################################
# Fetch the issue and parent milestone details
# #######################################################

log "Fetching issue and parent milestone details using gh CLI..."
data=$(
  gh api graphql \
    -F url="$issue_url" \
    -f query="$graphql_query" \
    --jq '.data.resource'
)

if [[ -z "$data" || "$data" == "null" ]]; then
  err "Could not retrieve issue data. Check the URL and your authentication."
fi

# #######################################################
# Parse issue metadata
# #######################################################

issue_number=$(pluck_field "$data" '.number')
issue_repo=$(pluck_field "$data" '.repository.nameWithOwner')
issue_milestone_title=$(pluck_field "$data" '.milestone.title // empty')
sub_issues=$(pluck_field "$data" '.subIssues.nodes')

# #######################################################
# Check if the parent issue is in the same repo
# #######################################################

if [[ "$issue_milestone_title" == "" ]]; then
  log "Parent issue (#$issue_number) has no milestone. Exiting."
  exit 0
fi

log "Parent issue: #$issue_number in $issue_repo, milestone: $issue_milestone_title"

# #######################################################
# Filter the sub-issues and extract numbers
# #######################################################

# Filter the sub-issues for issues that:
# - Are in the same repo
# - Have a different milestone from the parent issue
sub_issue_numbers=$(
  echo "$sub_issues" |\
  jq -r \
    --arg repo "$issue_repo" \
    --arg milestone "$issue_milestone_title" \
    '.[] | select(
      .repository.nameWithOwner == $repo
      and (.milestone.title != $milestone or .milestone == null)
    ) | .number'
)

# #######################################################
# Update the sub-issues milestones
# #######################################################

# Read the numbers into an array
issue_numbers=()
while read -r number; do
  if [[ -n "$number" ]]; then
    issue_numbers+=("$number")
  fi
done <<< "$sub_issue_numbers"

if [[ ${#issue_numbers[@]} -eq 0 ]]; then
  log "No sub-issues need milestone updates. Exiting."
  exit 0
fi

log "Found ${#issue_numbers[@]} sub-issues that need milestone updates"

# Update each sub-issue's milestone
for issue_number in "${issue_numbers[@]}"; do
  log "Updating milestone for issue #$issue_number"

  if [[ "$dry_run" == "true" ]]; then
    log "[DRY RUN] Would update issue #$issue_number milestone to \"$issue_milestone_title\""
  else
    # Use gh CLI to set milestone by title
    if gh issue edit \
      --repo "$issue_repo" \
      --milestone "$issue_milestone_title" \
      "$issue_number"; then
      log "Successfully updated milestone for issue #$issue_number to \"$issue_milestone_title\""
    else
      err "Failed to update milestone for issue #$issue_number"
    fi
  fi
done

if [[ "$dry_run" == "true" ]]; then
  log "[DRY RUN] Would have updated milestones for ${#issue_numbers[@]} sub-issues"
else
  log "Finished updating milestones for all sub-issues"
fi
