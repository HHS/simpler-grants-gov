#!/usr/bin/env bash
##
# This script inherits the milestone from the parent issue to the child issue.
# It uses the GitHub CLI to fetch the issue and parent milestone details,
# and then updates the issue milestone to match the parent's milestone.
#
# Usage: ./inherit_parent_milestone.sh [--dry-run] <issue-url>

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
      parent: parent {
        ... on Issue {
          number
          repository { nameWithOwner }
          milestone { number title }
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
# Parse issue and parent metadata
# #######################################################

# issue metadata
issue_number=$(pluck_field "$data" '.number')
issue_repo=$(pluck_field "$data" '.repository.nameWithOwner')
issue_milestone_title=$(pluck_field "$data" '.milestone.title // empty')

# parent issue metadata
parent_issue=$(pluck_field "$data" '.parent')
parent_repo=$(pluck_field "$parent_issue" '.repository.nameWithOwner')
parent_number=$(pluck_field "$parent_issue" '.number')
parent_milestone_title=$(pluck_field "$parent_issue" '.milestone.title // empty')

# #######################################################
# Check if the parent issue is in the same repo
# #######################################################

if [[ "$parent_repo" != "$issue_repo" ]]; then
  log "Parent issue is not in the same repo ($issue_repo). Exiting."
  exit 0
fi

if [[ "$parent_milestone_title" == "" ]]; then
  log "Parent issue (#$parent_number) has no milestone. Exiting."
  exit 0
fi

log "Parent issue: #$parent_number in $parent_repo, milestone: $parent_milestone_title"

if [[ "$issue_milestone_title" == "$parent_milestone_title" ]]; then
  log "Issue already has the same milestone as its parent. No action needed."
  exit 0
fi

# #######################################################
# Update the issue milestone
# #######################################################

log "Updating issue milestone to match parent..."

if [[ "$dry_run" == "true" ]]; then
  log "[DRY RUN] Would update issue #$issue_number milestone to \"$parent_milestone_title\""
else
  # Use gh CLI to set milestone by title
  gh issue edit \
    --repo "$issue_repo" \
    --milestone "$parent_milestone_title" \
    "$issue_number"

  log "Issue milestone updated successfully to \"$parent_milestone_title\"."
fi
