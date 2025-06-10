#! /bin/bash
# Propagate project metadata from parent issues to their children
# Usage:
# ./scripts/bulk-inherit-parent-deliverable.sh \
#   --org HHS \
#   --project 12

# #######################################################
# Define helper functions
# #######################################################

set -euo pipefail

log() { echo "[info] $1"; }
err() { echo "[error] $1" >&2; exit 1; }

pluck_field() {
  local json_data="$1"
  local field_path="$2"
  local default_value="${3:-}"
  jq -r "$field_path" <<< "$json_data"
}

# #######################################################
# Parse command line args with format `--option arg`
# #######################################################

# see this stack overflow for more details:
# https://stackoverflow.com/a/14203146/7338319
batch=100
dry_run=NO
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      log "Running in dry run mode"
      dry_run=YES
      shift # past argument
      ;;
    --batch)
      batch="$2"
      shift # past argument
      shift # past value
      ;;
    --org)
      org="$2"
      shift # past argument
      shift # past value
      ;;
    --project)
      project="$2"
      shift # past argument
      shift # past value
      ;;
    -*|--*)
      err "Unknown option $1"
      ;;
    *)
      POSITIONAL_ARGS+=("$1") # save positional arg
      shift # past argument
      ;;
  esac
done

# #######################################################
# Set script-specific variables
# #######################################################

log "Setting up script variables..."
mkdir -p tmp
proj_items_file="./tmp/project-items-export.json"
to_update_file="./tmp/items-to-update.txt"
query_dir="./queries"
fetch_query=$(cat "${query_dir}/getProjectItems.graphql")
mutation_query=$(cat "${query_dir}/updateProjectFieldValue.graphql")

# #######################################################
# Export project items
# #######################################################

log "Exporting project items..."
gh api graphql \
 --paginate \
 --field login="${org}" \
 --field project="${project}" \
 --field batch="${batch}" \
 -f query="${fetch_query}" \
 --jq ".data.organization.projectV2.items.nodes" |\
 # combine results into a single array
 jq --slurp 'add' |\
 jq "[.[] |
 # filter for the issues with a parent
 select(.content.parent != null)]" > $proj_items_file  # write output to a file

# #######################################################
# Filter for items that need to be updated
# #######################################################

log "Filtering for items that need metadata updates..."
# Extract issues whose metadata conflicts with the metadata of their parent
# Use the -c flag to condense each item to a single row in the output file
jq -c "
 .[] |

# start editing parent object in place
(.content.parent) |= (

  # filter for the correct project
  .projectItems.nodes[] as \$node |
  select(\$node.project.number == ${project}) |

  # pluck projectId and deliverable values from node
  {
    projectId: \$node.project.id,
    deliverable: \$node.deliverable
  }

) |
# end editing parent object in place

  # filter for items that have metadata conflicts with parent issue
  select(
    (.content.parent.deliverable != .deliverable)
    and (.content.parent.deliverable != null)
  ) |

  # pluck itemId, projectId, and deliverable values
  {
    itemId: .itemId,
    issueUrl: .content.url,
    projectId: .content.parent.projectId,
    deliverable: .content.parent.deliverable,
  }
" $proj_items_file > $to_update_file

# #######################################################
# Create a function to update project fields
# #######################################################

function updateProjectItem()
{
  # assign positional args to named variables
  local data=$1
  local query=$2

  # parse additional variables from the row data
  local project_id=$(pluck_field "$data" '.projectId')
  local item_id=$(pluck_field "$data" '.itemId')
  local issue_url=$(pluck_field "$data" '.issueUrl')
  local deliverable_field_id=$(pluck_field "$data" '.deliverable.field.id')
  local deliverable_val=$(pluck_field "$data" '.deliverable.optionId')

  # make an API call to update project item
  if [[ "$dry_run" == "YES" ]]; then
    log "Dry run mode: would update issue ${issue_url} to deliverable ${deliverable_val}"
  else
    log "Updating issue ${issue_url} to deliverable ${deliverable_val}"
    gh api graphql \
      --field projectId="${project_id}" \
      --field itemId="${item_id}" \
      --field fieldId="${deliverable_field_id}" \
      -f value="${deliverable_val}" \
      -f query="${query}"
  fi
}

# #######################################################
# Use this function to update each item
# #######################################################

log "Starting batch updates of project items..."
log "Found $(wc -l < $to_update_file | tr -d ' ') items to update"

while IFS= read -r row; do
  updateProjectItem "$row" "$mutation_query"
done < $to_update_file

log "Completed all updates successfully"
