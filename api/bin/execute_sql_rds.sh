#!/usr/bin/env bash
#
# Execute some SQL using the RDS Data API.
#
# Examples:
#   ./execute_sql_rds.sh <sql/table_list.sql
#   ./execute_sql_rds.sh --multiple <sql/select_from_foreign_table.sql
#
# When using --multiple, provide one SQL statement per input line.
#

set -o errexit -o pipefail

PROGRAM_NAME=$(basename "$0")

CYAN='\033[96m'
GREEN='\033[92m'
END='\033[0m'

RESOURCE_ARN='arn:aws:rds:...'
SECRET_ARN='arn:aws:secretsmanager:...'


main() {
  print_log "using database $RESOURCE_ARN"

  if [ "$1" == "--multiple" ]
  then
    print_log "multiple mode enabled (one statement per input line)"
    while read line
    do
      execute_statement "$line"
    done
  else
    execute_statement "$(cat)"
  fi
}


execute_statement() {
  print_log "$1"
  aws rds-data execute-statement \
      --resource-arn "$RESOURCE_ARN" \
      --database "app" \
      --secret-arn "$SECRET_ARN" \
      --sql "$1" \
      --format-records-as JSON \
      | jq -r .formattedRecords \
      | jtbl --truncate
}


# Utility functions
print_log() {
  printf "$CYAN%s $GREEN%s: $END%s\\n" "$(date "+%Y-%m-%d %H:%M:%S")" "$PROGRAM_NAME" "$*"
}

# Entry point
main "$1"
