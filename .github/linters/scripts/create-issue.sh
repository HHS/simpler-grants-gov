#! /bin/bash
# Create a new issue and update GitHub project values
# Usage:
# ./scripts/create-issue.sh \
#   --org HHS
#   --repo simpler-grants-gov
#   --project 13
#   --title "New issue title"
#   --body "Body of the issue"
#   --milestone "<name of milestone>"
#   --deliverable "<name of deliverable (case sensitive)>"
#   --track "<name of track (case sensitive)>"

# ##################################################
# parse command line args with format `--option arg`
# ##################################################
# see this stack overflow for more details:
# https://stackoverflow.com/a/14203146/7338319
while [[ $# -gt 0 ]]; do
  case $1 in
    --org)
      org="$2"
      shift # past argument
      shift # past value
      ;;
    --repo)
      repo="$2"
      shift # past argument
      shift # past value
      ;;
    --project)
      project="$2"
      shift # past argument
      shift # past value
      ;;
    --title)
      title="$2"
      shift # past argument
      shift # past value
      ;;
    --body)
      body="$2"
      shift # past argument
      shift # past value
      ;;
    --labels)
      labels="$2"
      shift # past argument
      shift # past value
      ;;
    --milestone)
      milestone="$2"
      shift # past argument
      shift # past value
      ;;
    --deliverable)
      deliverable="$2"
      shift # past argument
      shift # past value
      ;;
    --track)
      track="$2"
      shift # past argument
      shift # past value
      ;;
    --status)
      status="$2"
      shift # past argument
      shift # past value
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

# ########################################
# create the issue
# ########################################
echo "Creating the issue"
issue_url=$(gh issue create \
 --title "${title}" \
 --body "${body}" \
 --label "${labels}" \
 --milestone "${milestone}" \
 --repo "${org}/${repo}")
 echo "Successfully created issue: ${issue_url}"

# #######################################
# add issue to the project and get its id
# #######################################
echo "Adding issue: ${issue_url} to project: ${org}/${project}"
item_id=$(gh project item-add $project \
 --url "${issue_url}" \
 --owner "${org}" \
 --format json \
 --jq '.id')
 echo "Successfully create project item with id: ${item_id}"

# #######################################
# create a function to update project field
# #######################################
function updateProjectField()
{
  query=$(cat ./queries/get-single-select-field.graphql)
  field_name=$1
  field_value=$2
  # get the id for the field and the value we want to set
  field_data=$(gh api graphql \
  --paginate \
  --field org="${org}" \
  --field project="${project}" \
  --field fieldName="${field_name}" \
  --field fieldValue="${field_value}" \
  -f query="${query}" \
  --jq "{
      project: .data.login.projectV2.projectId,
      field: .data.login.projectV2.field.fieldId,
      value: .data.login.projectV2.field.options[0].optionId,
  }")
  echo "Got field IDs: ${field_data}"
  # parse each id into its own variable for the update command
  # use --raw-output to exclude surrounding quotes which break item-edit CLI command
  project_id=$(echo $field_data | jq --raw-output '.project')
  field_id=$(echo $field_data | jq --raw-output '.field')
  value_id=$(echo $field_data | jq --raw-output '.value')
  # update the value of this field
  gh project item-edit \
  --id $item_id \
  --project-id $project_id \
  --field-id $field_id \
  --single-select-option-id $value_id
}

# #######################################
# Use that function to update fields
# #######################################
if [[ -z "${deliverable}" ]];
  then echo "Value for deliverable not passed, using default";
  else
    echo "Setting the value of the deliverable column"
    updateProjectField "Deliverable" "${deliverable}";
fi
if [[ -z "${track}" ]];
  then echo "Value for track not passed, using default";
  else
    echo "Setting the value of the track column"
    updateProjectField "Track" "${track}";
fi
if [[ -z "${status}" ]];
  then echo "Value for status not passed, using default";
  else
    echo "Setting the value of the status column"
    updateProjectField "Status" "${status}";
fi
