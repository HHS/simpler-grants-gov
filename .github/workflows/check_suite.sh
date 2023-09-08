#!/bin/bash
set -euo pipefail

if [ "${BASH_VERSINFO[0]}" -lt 4 ]; then
  echo "Bash version >= 4.0 required. Current Bash version is ${BASH_VERSINFO[0]}.${BASH_VERSINFO[1]}."
  exit 1
fi

REPO="hhs/grants-equity"
SHA=$1

# Timeout settings
TIMEOUT_MINUTES=5
SLEEP_SECONDS=15
MAX_ITERATIONS=$(( ($TIMEOUT_MINUTES * 60) / $SLEEP_SECONDS ))

iteration=0
SHOULD_DEPLOY="false"

while :; do
  iteration=$(( $iteration + 1 ))
  if [ $iteration -gt $MAX_ITERATIONS ]; then
    echo "Script timed out after $TIMEOUT_MINUTES minutes."
    break
  fi

  CHECK_SUITE_DETAILS=$(gh api repos/$REPO/commits/$SHA/check-suites)
  CHECK_SUITE_STATUS=$(echo "$CHECK_SUITE_DETAILS" | jq -r '.check_suites[0].status')
  CHECK_SUITE_CONCLUSION=$(echo "$CHECK_SUITE_DETAILS" | jq -r '.check_suites[0].conclusion')

  if [[ "$CHECK_SUITE_STATUS" == "completed" ]]; then
    if [[ "$CHECK_SUITE_CONCLUSION" == "success" ]]; then
      SHOULD_DEPLOY="true"
      break
    else
      SHOULD_DEPLOY="false"
      case $CHECK_SUITE_CONCLUSION in
        failure|cancelled|timed_out|action_required|stale|neutral)
          echo "Check suite concluded with an issue. Not deploying."
          ;;
        *)
          echo "Check suite concluded with an unknown status. Not deploying."
          ;;
      esac
      break
    fi
  fi

  echo "Sleeping for $SLEEP_SECONDS seconds."
  sleep $SLEEP_SECONDS
done

echo "should_deploy=$SHOULD_DEPLOY" >> $GITHUB_OUTPUT
