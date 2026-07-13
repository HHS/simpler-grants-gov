#!/usr/bin/env bash
# Copy SSM parameters from one environment path to another.
# Usage: copy-ssm-params.sh <source_env> <target_env> [--dry-run] [--no-overwrite] [--app=<name>]
#
# Copies parameters matching /{app}/{source_env}/* to /{app}/{target_env}/*
# for all apps (api, frontend, nofos, analytics) unless narrowed with --app.
#
# Flags:
#   --dry-run       Preview what would happen without making changes.
#   --no-overwrite  Create-if-missing: only create target params that do NOT already
#                   exist; leave existing target values untouched. (Default overwrites.)
#   --app=<name>    Restrict to a single app: api, frontend, nofos, or analytics.
#
# Examples:
#   copy-ssm-params.sh staging grantee1
#   copy-ssm-params.sh dev grantee2 --dry-run
#   # Seed grantor1 api secrets from staging, creating only the ones that don't exist:
#   copy-ssm-params.sh staging grantor1 --app=api --no-overwrite

set -euo pipefail

SOURCE_ENV="${1:?source_env argument is required}"
TARGET_ENV="${2:?target_env argument is required}"
DRY_RUN="false"
OVERWRITE="true"
APP_FILTER=""

for arg in "${@:3}"; do
  case "${arg}" in
    --dry-run) DRY_RUN="true" ;;
    --no-overwrite) OVERWRITE="false" ;;
    --app=*) APP_FILTER="${arg#*=}" ;;
    *) echo "Unknown argument: ${arg}"; exit 1 ;;
  esac
done

VALID_SOURCES=("dev" "staging")
VALID_TARGETS=("grantee1" "grantee2" "grantor1")

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

# Narrow to a single app when --app is provided (e.g. --app=api).
if [[ -n "${APP_FILTER}" ]]; then
  if [[ ! " ${APP_PREFIXES[*]} " =~ " ${APP_FILTER} " ]]; then
    echo "ERROR: --app must be one of: ${APP_PREFIXES[*]}"
    exit 1
  fi
  APP_PREFIXES=("${APP_FILTER}")
fi

# These params contain environment-specific URLs that must not be overwritten
# in grantee environments — they are managed manually per environment.
SKIP_PARAMS=(
  "frontend-login-redirect-url"
  "frontend-base-url"
  "api-url"
)

TOTAL_COPIED=0
TOTAL_SKIPPED=0
TOTAL_EXISTS=0
FAILED_PARAMS=()

# When not overwriting, create new params without the --overwrite flag; existing ones
# are detected and skipped below. When overwriting, keep the original behavior.
OVERWRITE_FLAG=""
if [[ "${OVERWRITE}" == "true" ]]; then
  OVERWRITE_FLAG="--overwrite"
fi

echo "============================================================"
echo " Copy SSM Parameters"
echo "  Source:    ${SOURCE_ENV}"
echo "  Target:    ${TARGET_ENV}"
echo "  Apps:      ${APP_PREFIXES[*]}"
echo "  Mode:      $([[ "${OVERWRITE}" == "true" ]] && echo "overwrite existing" || echo "create-if-missing (no overwrite)")"
echo "  Dry run:   ${DRY_RUN}"
echo "============================================================"
echo ""

# Snapshot existing target parameters before overwriting so they can be
# restored manually if something goes wrong. Written to the job summary only
# (not stdout) to keep logs readable.
if [[ "${DRY_RUN}" == "false" ]]; then
  echo "------------------------------------------------------------"
  echo " Backing up existing target parameters (${TARGET_ENV})"
  echo "------------------------------------------------------------"

  BACKUP_LINES=()
  for APP in "${APP_PREFIXES[@]}"; do
    EXISTING=$(aws ssm get-parameters-by-path \
      --path "/${APP}/${TARGET_ENV}/" \
      --recursive \
      --with-decryption \
      --query "Parameters[*].{Name:Name,Value:Value,Type:Type}" \
      --output json 2>/dev/null || echo "[]")
    while IFS= read -r PARAM; do
      BACKUP_LINES+=("${PARAM}")
    done < <(echo "${EXISTING}" | jq -c '.[]')
  done

  BACKUP_COUNT=${#BACKUP_LINES[@]}
  echo "  Backed up ${BACKUP_COUNT} existing parameter(s) to job summary"
  echo ""

  {
    echo "## Backup: Existing Target Parameters Before Copy"
    echo ""
    echo "The following **${BACKUP_COUNT}** parameter(s) existed in \`${TARGET_ENV}\` before this run."
    echo "Use these values to restore manually if a rollback is needed."
    echo ""
    echo '```json'
    if [[ ${BACKUP_COUNT} -gt 0 ]]; then
      printf '%s\n' "${BACKUP_LINES[@]}" | jq -s '.'
    else
      echo '[]'
    fi
    echo '```'
    echo ""
  } >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
fi

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

    # Create-if-missing: leave any parameter that already exists in the target alone.
    if [[ "${OVERWRITE}" == "false" ]] && \
      aws ssm get-parameter --name "${TARGET_NAME}" --no-cli-pager >/dev/null 2>&1; then
      echo "  Exists, keeping target value: ${TARGET_NAME}"
      TOTAL_EXISTS=$((TOTAL_EXISTS + 1))
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

      if ! aws ssm put-parameter \
        --name "${TARGET_NAME}" \
        --value "${VALUE}" \
        --type "${TYPE}" \
        --tier "${TIER}" \
        ${OVERWRITE_FLAG} \
        --no-cli-pager > /dev/null; then
        echo "  ERROR: Failed to copy ${TARGET_NAME}"
        FAILED_PARAMS+=("${TARGET_NAME}")
        continue
      fi

      echo "  Done"
    fi

    TOTAL_COPIED=$((TOTAL_COPIED + 1))
  done < <(echo "${PARAMS}" | jq -c '.[]')

  echo ""
done

FAILED_COUNT=${#FAILED_PARAMS[@]}

echo "============================================================"
if [[ "${DRY_RUN}" == "true" ]]; then
  echo " DRY RUN complete — ${TOTAL_COPIED} parameter(s) would be copied, ${TOTAL_SKIPPED} skipped, ${TOTAL_EXISTS} already exist (kept)"
else
  echo " Copy complete — ${TOTAL_COPIED} parameter(s) copied, ${TOTAL_SKIPPED} skipped, ${TOTAL_EXISTS} already existed (kept)"
  if [[ ${FAILED_COUNT} -gt 0 ]]; then
    echo " FAILED: ${FAILED_COUNT} parameter(s) could not be copied:"
    for P in "${FAILED_PARAMS[@]}"; do echo "   - ${P}"; done
  fi
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
  echo "| **Apps** | \`${APP_PREFIXES[*]}\` |"
  echo "| **Mode** | $([[ "${OVERWRITE}" == "true" ]] && echo "overwrite existing" || echo "create-if-missing") |"
  echo "| **Dry run** | ${DRY_RUN} |"
  echo "| **Parameters copied** | ${TOTAL_COPIED} |"
  echo "| **Parameters skipped (env-specific)** | ${TOTAL_SKIPPED} |"
  echo "| **Parameters already existed (kept)** | ${TOTAL_EXISTS} |"
  if [[ ${FAILED_COUNT} -gt 0 ]]; then
    echo "| **Parameters failed** | ${FAILED_COUNT} |"
  fi
  echo ""
  echo "**Skipped parameters (environment-specific, preserved in target):**"
  for P in "${SKIP_PARAMS[@]}"; do echo "- \`${P}\`"; done
  if [[ ${FAILED_COUNT} -gt 0 ]]; then
    echo ""
    echo "**Failed parameters:**"
    for P in "${FAILED_PARAMS[@]}"; do echo "- \`${P}\`"; done
  fi
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"

if [[ ${FAILED_COUNT} -gt 0 ]]; then
  echo "ERROR: ${FAILED_COUNT} parameter(s) failed to copy. See above for details."
  exit 1
fi
