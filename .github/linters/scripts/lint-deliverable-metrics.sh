#!/usr/bin/env bash
##
# This script lints deliverable issues to check for proper acceptance criteria formatting.
# It fetches all issues of a specified type from a GitHub project and checks if they
# have checkboxes in their acceptance criteria sections.
#
# Usage: ./scripts/lint-deliverable-metrics.sh --org "HHS" --project "13" --issue-type "Deliverable" --dry-run

set -euo pipefail

# #######################################################
# Define constants
# #######################################################

ACCEPTANCE_CRITERIA_HEADER="### Acceptance criteria"
METRICS_HEADER="### Metrics"

# #######################################################
# Define helper functions
# #######################################################

log() { echo "[info] $1"; }
err() { echo "[error] $1" >&2; exit 1; }
warn() { echo "[warn] $1" >&2; }

# #######################################################
# Parse command line arguments
# #######################################################

dry_run=false
org="HHS"
project="13"
issue_type="Deliverable"

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      dry_run=true
      shift
      ;;
    --org)
      org="$2"
      shift 2
      ;;
    --project)
      project="$2"
      shift 2
      ;;
    --issue-type)
      issue_type="$2"
      shift 2
      ;;
    -*|--*)
      err "Unknown option $1"
      ;;
    *)
      err "Unknown argument $1"
      ;;
  esac
done

log "Starting linter"
log "Organization: $org"
log "Project: $project"
log "Issue type: $issue_type"
log "Dry run: $dry_run"

# #######################################################
# Initialize variables for in-memory data storage
# #######################################################

# Variables to store data in memory
raw_data=""
filtered_data=""
issue_count=0
issues_with_valid_ac=0
issues_without_valid_ac=0
issues_with_valid_metrics=0
issues_without_valid_metrics=0
failed_ac=()
failed_metrics=()

# #######################################################
# Fetch project issues
# #######################################################

log "Fetching project issues..."

query_file="queries/getProjectIssuesWithBody.graphql"
if [[ ! -f "$query_file" ]]; then
  err "Query file not found: $query_file"
fi

query=$(cat "$query_file")

# Fetch all issues using pagination and store in memory
raw_data=$(gh api graphql \
  --paginate \
  -F login="$org" \
  -F project="$project" \
  -F batch=100 \
  -f query="$query" \
  --jq '.data.organization.projectV2.items.nodes[]')

if [[ -z "$raw_data" ]]; then
  err "No issues found in project $project"
fi

# Count total items fetched
total_items=$(echo "$raw_data" | jq -s 'length')
#log "Fetched $total_items total items from project"


# #######################################################
# Filter issues by type and extract relevant data
# #######################################################

log "Filtering open issues by type '$issue_type'"

# Filter issues by type, excluding "Done" status
filtered_data=$(echo "$raw_data" | jq -s --arg issue_type "$issue_type" '
  map(select(
    .content.issueType.name == $issue_type and
    .content.body != null and
    .content.body != "" and
    .status.name != "Done"
  )) |
  map({
    title: .content.title,
    url: .content.url,
    body: .content.body,
    issueType: .content.issueType.name,
    status: .status.name
  })
')

issue_count=$(echo "$filtered_data" | jq 'length')
log "Found $issue_count open issues of type '$issue_type'"

if [[ "$issue_count" -eq 0 ]]; then
  log "No issues of type '$issue_type' found"
  exit 0
fi

# #######################################################
# Lint issues for valid acceptance criteria and metrics
# #######################################################

log "Linting issues for acceptance criteria and metrics..."

# Process each issue directly
for ((i=0; i<issue_count; i++)); do
  # Extract issue data directly using jq
  title=$(echo "$filtered_data" | jq -r ".[$i].title")
  url=$(echo "$filtered_data" | jq -r ".[$i].url")
  body=$(echo "$filtered_data" | jq -r ".[$i].body")

  log "Processing: $title ($url)"
  
  # Extract the acceptance criteria section and ensure it contains checkboxes
  ac_section=$(echo "$body" | sed -n "/$ACCEPTANCE_CRITERIA_HEADER/,/^###/{ /^###/d; p; }")
  if [[ -z "$ac_section" ]] || ! echo "$ac_section" | grep -q "\[[ x]\]"; then
    warn "  ❌ Acceptance criteria missing!"
    failed_ac+=("$title|$url")
  else
    ((issues_with_valid_ac++))
  fi

  # Extract the metrics section and ensure it contains checkboxes
  metrics_section=$(echo "$body" | sed -n "/$METRICS_HEADER/,/^###/{ /^###/d; p; }")
  if [[ -z "$metrics_section" ]] || ! echo "$metrics_section" | grep -q "\[[ x]\]"; then
    warn "  ❌ Metrics missing!"
    failed_metrics+=("$title|$url")
  else
    ((issues_with_valid_metrics++))
  fi

done

# Calculate issues without valid content
issues_without_valid_ac=$((issue_count - issues_with_valid_ac))
issues_without_valid_metrics=$((issue_count - issues_with_valid_metrics))

# #######################################################
# Display results
# #######################################################

log "Linting complete"
echo ""
echo "===== RESULTS ====="
echo ""

echo "Total issues processed: $issue_count"
echo "✅ Issues with valid acceptance criteria: $issues_with_valid_ac"
echo "✅ Issues with valid metrics: $issues_with_valid_metrics"
echo ""

if [[ "$issues_without_valid_ac" -gt 0 ]]; then
  echo "===== PROBLEMATIC ACCEPTANCE CRITERIA ====="
  echo "❌ Issues with missing acceptance criteria: $issues_without_valid_ac"
  printf '%s\n' "${failed_ac[@]}" | sort | while IFS='|' read -r title url; do
    echo "- $title ($url)"
  done
fi

echo ""

if [[ "$issues_without_valid_metrics" -gt 0 ]]; then
  echo "===== PROBLEMATIC METRICS ====="
  echo "❌ Issues with missing metrics: $issues_without_valid_metrics"
  printf '%s\n' "${failed_metrics[@]}" | sort | while IFS='|' read -r title url; do
    echo "- $title ($url)"
  done
fi

echo ""
