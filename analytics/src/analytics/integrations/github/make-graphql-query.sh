#! /bin/bash
# Propagate project metadata from parent issues to their children
# Usage:
# ./export-issue-metadata.sh \
#   --org HHS \
#   --roadmap-project 12 \
#   --sprint-project 13 \
#   --roadmap-file data/roadmap-data.json
#   --sprint-file data/sprint-data.json


# #######################################################
# Parse command line args with format `--option arg`
# #######################################################

batch=100
fields=()
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      echo "Running in dry run mode"
      dry_run=YES
      shift # past argument
      ;;
    --batch)
      batch="$2"
      shift 2 # past argument and value
      ;;
    --query)
      query="$2"
      shift 2 # past argument and value
      ;;
    # jq query to include in each API request during pagination
    --paginate-jq)
      paginate_jq="$2"
      shift 2 # past argument and value
      ;;
    # jq query to run after all pages have been retrieved
    --transform-jq)
      transform_jq="$2"
      shift 2 # past argument and value
      ;;
    --field)
      # Append field and value to newline
      fields+=("--field $2")
      shift 2 # past argument and value
      ;;
    -*|--*)
      echo "Unknown option $1"
      exit 1
      ;;
    *)
      positional_args+=("$1") # save positional arg
      shift # past argument
      ;;
  esac
done

# #######################################################
# Execute a graphql query
# #######################################################

# Build the gh api graphql command with dynamic fields
command="gh api graphql \\
 --header 'GraphQL-Features:sub_issues' \\
 --header 'GraphQL-Features:issue_types' \\
 --paginate \\
 --field batch=$batch"

# Loop over fields and append them individually, ensuring correct formatting
for field in "${fields[@]}"; do
  command+=" \\
 $field"
done

command+=" \\
 -f query='$query' \\
 --jq '$paginate_jq' | jq --slurp 'add'"

# Use echo -e to interpret the newline characters
# echo -e "$command"
eval "$command" | jq "${transform_jq}"
