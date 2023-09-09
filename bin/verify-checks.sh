#!/bin/bash
set -euo pipefail

# Required environment variables
REPO=${REPO:-""}
SHA=${SHA:-""}
CURRENT_GITHUB_RUN_ID=${CURRENT_GITHUB_RUN_ID:-""}

TIMEOUT_MINUTES=6
SLEEP_SECONDS=15
MAX_ITERATIONS=$(( ($TIMEOUT_MINUTES * 60) / $SLEEP_SECONDS ))

iteration=0

echo "Starting check run status polling for SHA: $SHA."
echo "Maximum iterations: $MAX_ITERATIONS. Time per iteration: $SLEEP_SECONDS seconds."

while :; do
  iteration=$(( $iteration + 1 ))
  echo "Iteration: $iteration of $MAX_ITERATIONS."

  if (( iteration > MAX_ITERATIONS )); then
    echo "Script timed out after $TIMEOUT_MINUTES minutes."
    exit 1
  fi

  echo "Fetching check run details... :)"
  CHECK_RUN_DETAILS=$(gh api repos/$REPO/commits/$SHA/check-runs)
  total_count=$(echo "${CHECK_RUN_DETAILS}" | jq '.total_count')
  echo "Total number of check runs: $total_count"

  all_runs_passed=true

  for (( i=0; i<$total_count; i++ )); do
    run=$(echo "${CHECK_RUN_DETAILS}" | jq -c ".check_runs[$i]")
    CHECK_RUN_ID=$(echo "$run" | jq -r '.id')
    CHECK_RUN_STATUS=$(echo "$run" | jq -r '.status')
    CHECK_RUN_CONCLUSION=$(echo "$run" | jq -r '.conclusion')

    # Skip the current GitHub Actions run to prevent the script from waiting on itself to complete.
    if [[ "$CHECK_RUN_ID" == "$CURRENT_GITHUB_RUN_ID" ]]; then
      echo "Skipping current run ID: $CURRENT_GITHUB_RUN_ID."
      continue
    fi

    echo "Processing check run ID $CHECK_RUN_ID."

    if [[ "$CHECK_RUN_STATUS" != "completed" ]]; then
      echo "Check run ID $CHECK_RUN_ID has not yet completed. Status: $CHECK_RUN_STATUS."
      all_runs_passed=false
      break
    elif [[ "$CHECK_RUN_CONCLUSION" != "success" ]]; then
      all_runs_passed=false

      case $CHECK_RUN_CONCLUSION in
        failure|cancelled|timed_out|action_required|stale|neutral)
          echo "Check run ID $CHECK_RUN_ID concluded with status $CHECK_RUN_CONCLUSION."
          ;;
        *)
          echo "Check run ID $CHECK_RUN_ID concluded with an unknown status."
          ;;
      esac

      exit 1
    fi
  done

  if [ "$all_runs_passed" = true ]; then
    echo "All check runs have passed."
    break
  fi

  echo "Sleeping for $SLEEP_SECONDS seconds before the next iteration."
  sleep $SLEEP_SECONDS
done
