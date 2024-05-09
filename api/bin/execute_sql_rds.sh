#!/usr/bin/env bash
#
# Execute some SQL using the RDS Data API.
#
# Examples:
#   ./execute_sql_rds.sh <sql/table_list.sql
#   ./execute_sql_rds.sh --cluster=api-prod --multiple <sql/select_from_foreign_table.sql
#
# When using --multiple, provide one SQL statement per input line.
#

set -o errexit -o pipefail

PROGRAM_NAME=$(basename "$0")

CYAN='\033[96m'
GREEN='\033[92m'
END='\033[0m'

CLUSTER=api-dev

USAGE="Usage: $PROGRAM_NAME [OPTION]

  --multiple         one SQL statement per input line (otherwise expects a single multi-line statement)
  --cluster=CLUSTER  target RDS cluster (default $CLUSTER)
"


main() {
  cluster="$CLUSTER"
  parse_arguments "$@"
  print_log "using cluster $cluster"
  read_cluster_arns
  create_temporary_directory

  count=1
  if [ $multiple ]
  then
    while read line
    do
      execute_statement "$line"
      count=$((count + 1))
    done
  else
    execute_statement "$(cat)"
  fi
}


parse_arguments() {
  for arg in "$@"
  do
    if [ "$arg" == "--multiple" ]; then
      print_log "multiple mode enabled (one statement per input line)"
      multiple=1
    elif [[ "$arg" =~ ^--cluster=(.*)$ ]]; then
      cluster="${BASH_REMATCH[1]}"
    else
      echo "$USAGE"
      exit 1
    fi
  done
}


read_cluster_arns() {
  resource_arn=$(aws rds describe-db-clusters --db-cluster-identifier="$cluster" \
                     --query='DBClusters[0].DBClusterArn' --output=text)
  secret_arn=$(aws rds describe-db-clusters --db-cluster-identifier="$cluster" \
                   --query='DBClusters[0].MasterUserSecret.SecretArn' --output=text)
  print_log "database resource $resource_arn"
}


create_temporary_directory() {
  tmp_dir="/tmp/execute_sql_rds/execute_sql_rds.$(date +%s)"
  mkdir -m "u=rwx,g=,o=" -p "$tmp_dir"
  print_log "temporary directory $tmp_dir"
}


execute_statement() {
  print_log "$1"
  result_path="$tmp_dir/result_$count.json"

  aws rds-data execute-statement \
      --resource-arn "$resource_arn" \
      --database "app" \
      --secret-arn "$secret_arn" \
      --sql "$1" \
      --continue-after-timeout \
      --format-records-as JSON \
      >"$result_path"

  if grep formattedRecords "$result_path" >/dev/null
  then
    jq -r .formattedRecords "$result_path" | jtbl --truncate --markdown
  else
    cat "$result_path"
  fi
}


# Utility functions
print_log() {
  printf "$CYAN%s $GREEN%s: $END%s\\n" "$(date "+%Y-%m-%d %H:%M:%S")" "$PROGRAM_NAME" "$*"
}

# Entry point
main "$@"
