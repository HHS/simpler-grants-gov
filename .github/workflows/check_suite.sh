#!/bin/bash
set -euo pipefail

REPO="hhs/grants-equity"
SHA=$1

TIMEOUT_MINUTES=5
SLEEP_SECONDS=15
MAX_ITERATIONS=$(( ($TIMEOUT_MINUTES * 60) / $SLEEP_SECONDS ))

iteration=0
SHOULD_DEPLOY="false"

echo "Starting check suite status polling for SHA: $SHA."
echo "Maximum iterations: $MAX_ITERATIONS. Time per iteration: $SLEEP_SECONDS seconds."

while :; do
  iteration=$(( $iteration + 1 ))
  echo "Iteration: $iteration of $MAX_ITERATIONS."

  if (( iteration > MAX_ITERATIONS )); then
    echo "Script timed out after $TIMEOUT_MINUTES minutes."
    exit 1
  fi

  echo "Fetching check suite details..."
  CHECK_SUITE_DETAILS=$(gh api repos/$REPO/commits/$SHA/check-suites)
  total_count=$(echo "${CHECK_SUITE_DETAILS}" | jq '.total_count')
  all_suites_passed=true

  echo "Total number of check suites: $total_count"

  for (( i=0; i<$total_count; i++ )); do
    suite=$(echo "${CHECK_SUITE_DETAILS}" | jq -c ".check_suites[$i]")
    CHECK_SUITE_STATUS=$(echo "$suite" | jq -r '.status')
    CHECK_SUITE_CONCLUSION=$(echo "$suite" | jq -r '.conclusion')

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
    SHOULD_DEPLOY="true"
    break
  fi

  echo "Sleeping for $SLEEP_SECONDS seconds before the next iteration."
  sleep $SLEEP_SECONDS
done

echo "should_deploy=$SHOULD_DEPLOY" >> $GITHUB_OUTPUT
