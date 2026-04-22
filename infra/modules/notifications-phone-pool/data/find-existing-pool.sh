#!/usr/bin/env bash

# find-existing-pool.sh
# Script to find existing SMS phone pools in a specified AWS region
# Called once per region by Terraform for multi-region support
#
# Usage: find-existing-pool.sh <region>
#
# Parameters:
#   region (required): AWS region to search in
#
# Returns: JSON object with pool information
# {
#   "pool_id": "pool-id-value-or-empty",
#   "pool_arn": "pool-arn-value-or-empty",
#   "exists": "true|false"
# }

set -euo pipefail

# Get region parameter (always provided by Terraform)
# Get region parameter (always provided by Terraform)
region="${1}"

# Get first available pool without filtering by name
query="Pools[0].{PoolId:PoolId,PoolArn:PoolArn}"

# List SMS phone pools using AWS CLI with specified region
pools=$(aws pinpoint-sms-voice-v2 describe-pools \
  --region "${region}" \
  --query "${query}" \
  --output json 2>/dev/null || echo '{}')

# Check if any pools were found
if [[ "${pools}" == "{}" ]] || [[ "${pools}" == "null" ]]; then
  echo '{"pool_id":"","pool_arn":"","exists":"false"}'
  exit 0
fi

# Extract pool details
pool_id=$(echo "${pools}" | jq -r '.PoolId // ""')
pool_arn=$(echo "${pools}" | jq -r '.PoolArn // ""')

# Validate that we have valid pool data
if [[ -z "${pool_id}" ]] || [[ "${pool_id}" == "null" ]]; then
  echo '{"pool_id":"","pool_arn":"","exists":"false"}'
else
  echo "{\"pool_id\":\"${pool_id}\",\"pool_arn\":\"${pool_arn}\",\"exists\":\"true\"}"
fi