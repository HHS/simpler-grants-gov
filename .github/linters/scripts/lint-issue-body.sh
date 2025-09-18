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

HEADER_ACCEPTANCE_CRITERIA="### Acceptance criteria"
HEADER_METRICS="### Metrics"
HEADER_SUMMARY="### Summary"
DEFAULT_ORG="HHS"
DEFAULT_PROJECT="13"
DEFAULT_ISSUE_TYPE="Deliverable"
ALLOWED_ISSUE_TYPES=("Deliverable" "Proposal")

# #######################################################
# Initialize variables for tracking results
# #######################################################

ac_valid_count=0
ac_invalid_count=0
ac_failed_issues=()
metrics_valid_count=0
metrics_invalid_count=0
metrics_failed_issues=()
summary_valid_count=0
summary_invalid_count=0
summary_failed_issues=()

# #######################################################
# Define helper functions
# #######################################################

log() { echo "[info] $1" >&2; }
err() { echo "[error] $1" >&2; exit 1; }
warn() { echo "[warn] $1" >&2; }

# #######################################################
# Parse command line arguments
# #######################################################

parse_args() {
  local dry_run=false
  local org=$DEFAULT_ORG
  local project=$DEFAULT_PROJECT
  local issue_type=$DEFAULT_ISSUE_TYPE

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

  # Validate arguments
  if [[ ! " ${ALLOWED_ISSUE_TYPES[*]} " =~ " $issue_type " ]]; then
    err "Invalid issue type '$issue_type'. Allowed types: ${ALLOWED_ISSUE_TYPES[*]}"
  fi

  # Return parsed values
  echo "$dry_run $org $project $issue_type"
}

# #######################################################
# Fetch data
# #######################################################

fetch_data() {
  log "Fetching items"

  query_file="queries/getProjectIssuesWithBody.graphql"
  if [[ ! -f "$query_file" ]]; then
    err "Query file not found: $query_file"
  fi

  query=$(cat "$query_file")

  # Fetch all issues using pagination and store in memory
  raw_response=$(gh api graphql \
    --paginate \
    -F login="$org" \
    -F project="$project" \
    -F batch=100 \
    -f query="$query")

  # Check if response is empty
  if [[ -z "$raw_response" ]]; then
    err "Empty response from GitHub API"
  fi

  # Check for errors in the response
  if echo "$raw_response" | jq -e '.errors' > /dev/null 2>&1; then
    err "GitHub API error: $(echo "$raw_response" | jq -r '.errors[0].message')"
  fi

  # Extract the nodes from the response
  if ! raw_data=$(echo "$raw_response" | jq -r '.data.organization.projectV2.items.nodes[]' 2>&1); then
    err "Failed to extract nodes from response"
  fi

  if [[ -z "$raw_data" ]]; then
    err "No items found in project $project"
  fi

  # Count total items fetched
  if ! total_items=$(echo "$raw_data" | jq -s 'length' 2>&1); then
    err "Failed to count items: $total_items"
  fi

  # Filter issues by type, excluding "Done" status
  log "Filtering items by type '$issue_type'"
  if ! filtered_data=$(echo "$raw_data" | jq -s --arg issue_type "$issue_type" '
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
  ' 2>&1); then
    err "Failed to filter items: $filtered_data"
  fi

  if ! issue_count=$(echo "$filtered_data" | jq 'length' 2>&1); then
    err "Failed to count filtered items: $issue_count"
  fi

  log "Found $issue_count items of type '$issue_type'"

  # Return the filtered data
  echo "$filtered_data"
}

# #######################################################
# Lint issues
# #######################################################

lint_issue_body() {
  local issue_type="$1"
  local filtered_data="$2"
  local issue_count="$3"
  
  log "Linting items"

  # Process each issue directly
  for ((i=0; i<issue_count; i++)); do
    # Extract issue data directly using jq
    local title
    local url
    local body
    
    if ! title=$(echo "$filtered_data" | jq -r ".[$i].title" 2>&1); then
      err "Failed to extract title for item $i: $title"
    fi
    
    if ! url=$(echo "$filtered_data" | jq -r ".[$i].url" 2>&1); then
      err "Failed to extract url for item $i: $url"
    fi
    
    if ! body=$(echo "$filtered_data" | jq -r ".[$i].body" 2>&1); then
      err "Failed to extract body for item $i: $body"
    fi

    log "Processing: $title ($url)"

    # Validate body contents
    case "$issue_type" in 
      Deliverable)
        validate_acceptance_criteria "$body" "$title" "$url"
        validate_metrics "$body" "$title" "$url"
        ;;
      Proposal)
        validate_summary "$body" "$title" "$url"
        ;;
    esac 

  done

  log "Done linting items"
}

validate_acceptance_criteria() {
  local body="$1"
  local title="$2"
  local url="$3"

  # Extract the acceptance criteria section and ensure it contains checkboxes
  local ac_section=$(echo "$body" | sed -n "/$HEADER_ACCEPTANCE_CRITERIA/,/^###/{ /^###/d; p; }")
  if [[ -z "$ac_section" ]] || ! echo "$ac_section" | grep -q "\[[ x]\]"; then
    warn "  ❌ Acceptance criteria missing!"
    ac_failed_issues+=("$title|$url")
  else
    ac_valid_count=$((ac_valid_count + 1))
  fi
}

validate_metrics() {
  local body="$1"
  local title="$2"
  local url="$3"

  # Extract the metrics section and ensure it contains checkboxes
  local metrics_section=$(echo "$body" | sed -n "/$HEADER_METRICS/,/^###/{ /^###/d; p; }")
  if [[ -z "$metrics_section" ]] || ! echo "$metrics_section" | grep -q "\[[ x]\]"; then
    warn "  ❌ Metrics missing!"
    metrics_failed_issues+=("$title|$url")
  else
    metrics_valid_count=$((metrics_valid_count + 1))
  fi
}

validate_summary() {
  local body="$1"
  local title="$2"
  local url="$3"

  # Extract the summary section and ensure it contains something
  local summary_section=$(echo "$body" | sed -n "/$HEADER_SUMMARY/,/^###/{ /^###/d; p; }")
  if [[ -z "$summary_section" ]]; then
    warn "  ❌ Summary missing!"
    summary_failed_issues+=("$title|$url")
  else
    summary_valid_count=$((summary_valid_count + 1))
  fi
}

# #######################################################
# Display results
# #######################################################

display_results() {
  local issue_type="$1"
  local issue_count="$2"
  local ac_valid_count="$3"
  local ac_invalid_count="$4"
  local metrics_valid_count="$5"
  local metrics_invalid_count="$6"
  local summary_valid_count="$7"
  local summary_invalid_count="$8"

  echo ""
  echo "===== RESULTS ====="
  echo ""
  echo "Total issues processed: $issue_count"

  case "$issue_type" in 
    Deliverable)
      echo "✅ Total issues with valid acceptance criteria: $ac_valid_count"
      echo "✅ Total issues with valid metrics: $metrics_valid_count"
      echo ""
      ;;
    Proposal)
      echo "✅ Total issues with valid summary: $summary_valid_count"
      echo ""
      ;;
  esac 

  case "$issue_type" in 
    Deliverable)
      if [[ "$ac_invalid_count" -gt 0 ]]; then
        echo "===== ISSUES WITH INVALID ACCEPTANCE CRITERIA ====="
        echo "❌ Total issues with invalid acceptance criteria: $ac_invalid_count"
        if [[ ${#ac_failed_issues[@]} -gt 0 ]]; then
          printf '%s\n' "${ac_failed_issues[@]}" | sort | while IFS='|' read -r title url; do
            echo "- $title ($url)"
          done
        fi
      fi
      echo ""
      if [[ "$metrics_invalid_count" -gt 0 ]]; then
        echo "===== ISSUES WITH INVALID METRICS ====="
        echo "❌ Total issues with invalid metrics: $metrics_invalid_count"
        if [[ ${#metrics_failed_issues[@]} -gt 0 ]]; then
          printf '%s\n' "${metrics_failed_issues[@]}" | sort | while IFS='|' read -r title url; do
            echo "- $title ($url)"
          done
        fi
      fi
      echo ""
      ;;
    Proposal)
      if [[ "$summary_invalid_count" -gt 0 ]]; then
        echo "===== ISSUES WITH INVALID SUMMARY ====="
        echo "❌ Total issues with invalid summary: $summary_invalid_count"
        if [[ ${#summary_failed_issues[@]} -gt 0 ]]; then
          printf '%s\n' "${summary_failed_issues[@]}" | sort | while IFS='|' read -r title url; do
            echo "- $title ($url)"
          done
        fi
      fi
      echo ""
      ;;
  esac
}

# #######################################################
# Main
# #######################################################

# Parse command line arguments
read -r dry_run org project issue_type <<< "$(parse_args "$@")"

log "Starting linter"
log "Organization: $org"
log "Project: $project"
log "Issue type: $issue_type"
log "Dry run: $dry_run"

# Fetch data
filtered_data=$(fetch_data)
issue_count=$(echo "$filtered_data" | jq 'length' 2>&1)
issue_count=${issue_count:-0}

# Lint issues
if [[ "$issue_count" -gt 0 ]]; then
   lint_issue_body "$issue_type" "$filtered_data" "$issue_count"
fi

# Calculate issues without valid content
ac_invalid_count=$((issue_count - ac_valid_count))
metrics_invalid_count=$((issue_count - metrics_valid_count))
summary_invalid_count=$((issue_count - summary_valid_count))

# Display results
display_results "$issue_type" "$issue_count" "$ac_valid_count" "$ac_invalid_count" "$metrics_valid_count" "$metrics_invalid_count" "$summary_valid_count" "$summary_invalid_count"
