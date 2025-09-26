#!/usr/bin/env bash
##
# This script inherits the milestone from the parent issue to the child issue.
# It uses the GitHub CLI to fetch the issue and parent milestone details,
# and then updates the issue milestone to match the parent's milestone.
#
# Usage: ./scripts/inherit-parent-deliverable.sh <issue-url> --dry-run --project <project-number>

# #######################################################
# Define helper functions
# #######################################################

set -euo pipefail

log() { echo "[info] $1"; }
err() { echo "[error] $1" >&2; exit 1; }

pluck_field() {
  local json_data="$1"
  local field_path="$2"
  local default_value="${3:-}"
  jq -r "$field_path" <<< "$json_data"
}


# #######################################################
# Parse command line arguments
# #######################################################

dry_run=false
issue_url=""
project_number=13
query_dir="./queries"

while [[ $# -gt 0 ]]; do
  case $1 in
    -d|--dry-run)
      dry_run=true
      shift
      ;;
    -p|--project)
      project_number="$2"
      shift 2
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
# Define the GraphQL queries
# #######################################################

fetch_query=$(cat $query_dir/getParentFieldValues.graphql)
mutation_query=$(cat $query_dir/updateProjectFieldValue.graphql)

# #######################################################
# Fetch the issue and parent milestone details
# #######################################################

log "Fetching issue and parent milestone details using gh CLI..."
data=$(
  gh api graphql \
    --field url="$issue_url" \
    --raw-field query="$fetch_query" \
    --jq '.data.resource'
)

if [[ -z "$data" || "$data" == "null" ]]; then
  err "Could not retrieve issue data. Check the URL and your authentication."
fi

# #######################################################
# Extract the necessary fields
# #######################################################

# First check if parent exists
if [[ $(pluck_field "$data" ".parent") == "null" ]]; then
  log "No parent issue found. Exiting."
  exit 0
fi

# Then pluck the specific project items
parent_project_item=$(pluck_field "$data" ".parent.projectItems.nodes[] | select(.project.number == $project_number)")
child_project_item=$(pluck_field "$data" ".projectItems.nodes[] | select(.project.number == $project_number)")

# Check if child project item exists
if [[ -z "$child_project_item" || "$child_project_item" == "null" ]]; then
  log "Child issue is not in project $project_number. Exiting."
  exit 0
fi

# Extract remaining fields
parent_deliverable_field_id=$(pluck_field "$parent_project_item" '.deliverable.field.id')
parent_deliverable_option_id=$(pluck_field "$parent_project_item" '.deliverable.optionId')
parent_deliverable_option_name=$(pluck_field "$parent_project_item" '.deliverable.name')
child_project_id=$(pluck_field "$child_project_item" '.project.id')
child_item_id=$(pluck_field "$child_project_item" '.itemId')
child_deliverable_option_id=$(pluck_field "$child_project_item" '.deliverable.optionId')

# #######################################################
# Check conditions before updating
# #######################################################

# Check if parent has project items for the specified project
if [[ -z "$parent_project_item" || "$parent_project_item" == "null" ]]; then
  log "Parent issue is not in project $project_number. Exiting."
  exit 0
fi

# Check if parent has a deliverable
if [[ -z "$parent_deliverable_option_id" || "$parent_deliverable_option_id" == "null" ]]; then
  log "Parent issue has no deliverable value. Exiting."
  exit 0
fi

# Check if deliverable values match
if [[ "$child_deliverable_option_id" == "$parent_deliverable_option_id" ]]; then
  log "Deliverable values already match. No action needed."
  exit 0
fi

# #######################################################
# Update the deliverable field
# #######################################################

# Update the deliverable field
# Note: We need to pass the value as a raw field to prevent the gh CLI from parsing
#       the option ID as a number if there are no alphabetic characters e.g. 360523
log "Updating deliverable field to match parent: '$parent_deliverable_option_name'"
gh api graphql \
  --field projectId="$child_project_id" \
  --field itemId="$child_item_id" \
  --field fieldId="$parent_deliverable_field_id" \
  --raw-field value="$parent_deliverable_option_id" \
  --raw-field query="$mutation_query"
log "Deliverable field updated successfully to '$parent_deliverable_option_name'"
