#!/bin/bash
set -euo pipefail

if [ -z "$REPO" ] || [ -z "$SHA" ] || [ -z "$CURRENT_GITHUB_RUN_ID" ]; then
  echo "Error: Required environment variables are not set."
  exit 1
fi

TIMEOUT_MINUTES=5
SLEEP_SECONDS=15
MAX_ITERATIONS=$(( (TIMEOUT_MINUTES * 60) / SLEEP_SECONDS ))

iteration=0

echo "Starting check suite status polling for SHA: $SHA."
echo "Maximum iterations: $MAX_ITERATIONS. Time per iteration: $SLEEP_SECONDS seconds."

# Fetch the current check_suite_id
CURRENT_CHECK_SUITE_ID=$(gh api repos/"$REPO"/actions/runs/"$CURRENT_GITHUB_RUN_ID" --jq '.check_suite_id')
while :; do
  iteration=$(( iteration + 1 ))
  echo "Iteration: $iteration of $MAX_ITERATIONS."

  if (( iteration > MAX_ITERATIONS )); then
    echo "Script timed out after $TIMEOUT_MINUTES minutes."
    exit 1
  fi

  echo "Fetching check suite details... <3"
  CHECK_SUITE_DETAILS=$(gh api repos/"$REPO"/commits/"$SHA"/check-suites)
  total_count=$(echo "${CHECK_SUITE_DETAILS}" | jq '.total_count')
  all_suites_passed=true

  echo "Total number of check suites: $total_count"

  for (( i=0; i<total_count; i++ )); do
    suite=$(echo "${CHECK_SUITE_DETAILS}" | jq -c ".check_suites[$i]")
    CHECK_SUITE_ID=$(echo "$suite" | jq -r '.id')
    CHECK_SUITE_STATUS=$(echo "$suite" | jq -r '.status')
    CHECK_SUITE_CONCLUSION=$(echo "$suite" | jq -r '.conclusion')

    # Skip the current GitHub Actions run to prevent the script from waiting on itself to complete.
    if [[ "$CHECK_SUITE_ID" == "$CURRENT_CHECK_SUITE_ID" ]]; then
      echo "Skipping current check suite ID: $CURRENT_CHECK_SUITE_ID."
      continue
    fi

    echo "Processing check suite $(echo "$suite" | jq -r '.id')."

    if [[ "$CHECK_SUITE_STATUS" != "completed" ]]; then
      echo "Check suite with ID $(echo "$suite" | jq -r '.id') has not yet completed. Status: $CHECK_SUITE_STATUS."
      all_suites_passed=false
      break
    elif [[ "$CHECK_SUITE_CONCLUSION" != "success" ]]; then
      all_suites_passed=false

      case $CHECK_SUITE_CONCLUSION in
        failure|cancelled|timed_out|action_required|stale|neutral)
          echo "Check suite with ID $(echo "$suite" | jq -r '.id') concluded with status $CHECK_SUITE_CONCLUSION."
          ;;
        *)
          echo "Check suite with ID $(echo "$suite" | jq -r '.id') concluded with an unknown status."
          ;;
      esac

      exit 1
    fi
  done

  if [ "$all_suites_passed" = true ]; then
    echo "All check suites have passed."
    break
  fi

  echo "Sleeping for $SLEEP_SECONDS seconds before the next iteration."
  sleep $SLEEP_SECONDS
done
