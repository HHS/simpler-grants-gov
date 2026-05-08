#!/usr/bin/env bash
# Copy all SSM parameters from one environment path to another.
# Usage: copy-ssm-params.sh <source_env> <target_env> [--dry-run]
#
# Copies parameters matching /{app}/{source_env}/* to /{app}/{target_env}/*
# for all apps: api, frontend, nofos, analytics
#
# Example:
#   copy-ssm-params.sh staging grantee1
#   copy-ssm-params.sh dev grantee2 --dry-run

set -euo pipefail

SOURCE_ENV="${1:?source_env argument is required}"
TARGET_ENV="${2:?target_env argument is required}"
DRY_RUN="false"

for arg in "${@:3}"; do
  case "${arg}" in
    --dry-run) DRY_RUN="true" ;;
    *) echo "Unknown argument: ${arg}"; exit 1 ;;
  esac
done

VALID_SOURCES=("dev" "staging")
VALID_TARGETS=("grantee1" "grantee2")

if [[ ! " ${VALID_SOURCES[*]} " =~ " ${SOURCE_ENV} " ]]; then
  echo "ERROR: source_env must be one of: ${VALID_SOURCES[*]}"
  exit 1
fi

if [[ ! " ${VALID_TARGETS[*]} " =~ " ${TARGET_ENV} " ]]; then
  echo "ERROR: target_env must be one of: ${VALID_TARGETS[*]}"
  exit 1
fi

if [[ "${SOURCE_ENV}" == "${TARGET_ENV}" ]]; then
  echo "ERROR: source_env and target_env must be different"
  exit 1
fi

APP_PREFIXES=("api" "frontend" "nofos" "analytics")

# These params contain environment-specific URLs that must not be overwritten
# in grantee environments — they are managed manually per environment.
SKIP_PARAMS=(
  "frontend-login-redirect-url"
  "frontend-base-url"
  "api-url"
)

TOTAL_COPIED=0
TOTAL_SKIPPED=0

echo "============================================================"
echo " Copy SSM Parameters"
echo "  Source: ${SOURCE_ENV}"
echo "  Target: ${TARGET_ENV}"
echo "  Dry run: ${DRY_RUN}"
echo "============================================================"
echo ""

for APP in "${APP_PREFIXES[@]}"; do
  SOURCE_PATH="/${APP}/${SOURCE_ENV}/"

  echo "------------------------------------------------------------"
  echo "App: ${APP}  (${SOURCE_PATH})"
  echo "------------------------------------------------------------"

  PARAMS=$(aws ssm get-parameters-by-path \
    --path "${SOURCE_PATH}" \
    --recursive \
    --with-decryption \
    --query "Parameters[*].{Name:Name,Value:Value,Type:Type}" \
    --output json 2>/dev/null || echo "[]")

  PARAM_COUNT=$(echo "${PARAMS}" | jq 'length')

  if [[ "${PARAM_COUNT}" -eq 0 ]]; then
    echo "  No parameters found, skipping"
    echo ""
    continue
  fi

  echo "  Found ${PARAM_COUNT} parameter(s)"
  echo ""

  while IFS= read -r PARAM; do
    NAME=$(echo "${PARAM}" | jq -r '.Name')
    VALUE=$(echo "${PARAM}" | jq -r '.Value')
    TYPE=$(echo "${PARAM}" | jq -r '.Type')

    TARGET_NAME=$(echo "${NAME}" | sed "s|/${SOURCE_ENV}/|/${TARGET_ENV}/|")

    PARAM_KEY=$(basename "${NAME}")
    if [[ " ${SKIP_PARAMS[*]} " =~ " ${PARAM_KEY} " ]]; then
      echo "  Skipping: ${NAME}  (environment-specific, preserved in target)"
      TOTAL_SKIPPED=$((TOTAL_SKIPPED + 1))
      continue
    fi

    VALUE_LEN=${#VALUE}
    TIER="Standard"
    if [[ "${VALUE_LEN}" -gt 4096 ]]; then
      TIER="Advanced"
    fi

    if [[ "${DRY_RUN}" == "true" ]]; then
      echo "  [DRY RUN] ${NAME}"
      echo "         -> ${TARGET_NAME}  (${TYPE}, ${TIER} tier, ${VALUE_LEN} chars)"
    else
      echo "  Copying: ${NAME}"
      echo "       to: ${TARGET_NAME}  (${TYPE}, ${TIER} tier)"

      aws ssm put-parameter \
        --name "${TARGET_NAME}" \
        --value "${VALUE}" \
        --type "${TYPE}" \
        --tier "${TIER}" \
        --overwrite \
        --no-cli-pager > /dev/null

      echo "  Done"
    fi

    TOTAL_COPIED=$((TOTAL_COPIED + 1))
  done < <(echo "${PARAMS}" | jq -c '.[]')

  echo ""
done

echo "============================================================"
if [[ "${DRY_RUN}" == "true" ]]; then
  echo " DRY RUN complete — ${TOTAL_COPIED} parameter(s) would be copied, ${TOTAL_SKIPPED} skipped"
else
  echo " Copy complete — ${TOTAL_COPIED} parameter(s) copied, ${TOTAL_SKIPPED} skipped"
fi
echo "============================================================"

# Write job summary
{
  echo "## SSM Parameter Copy Summary"
  echo ""
  echo "| | |"
  echo "|---|---|"
  echo "| **Source** | \`${SOURCE_ENV}\` |"
  echo "| **Target** | \`${TARGET_ENV}\` |"
  echo "| **Dry run** | ${DRY_RUN} |"
  echo "| **Parameters copied** | ${TOTAL_COPIED} |"
  echo "| **Parameters skipped** | ${TOTAL_SKIPPED} |"
  echo ""
  echo "**Skipped parameters (environment-specific, preserved in target):**"
  for P in "${SKIP_PARAMS[@]}"; do echo "- \`${P}\`"; done
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
