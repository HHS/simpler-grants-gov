#! /bin/bash
# Usage: ./scripts/update-deliverable-values.sh --dry-run
# Updates

# parse command line args with format `--option arg`
# see this stack overflow for more details:
# https://stackoverflow.com/a/14203146/7338319
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      echo "Running in dry run mode"
      DRY_RUN=YES
      shift # past argument
      ;;
    --batch)
      BATCH="$2"
      shift # past argument
      shift # past value
      ;;
    --org)
      ORG="$2"
      shift # past argument
      shift # past value
      ;;
    --status)
      STATUS="$2"
      shift # past argument
      shift # past value
      ;;
    --roadmap-project)
      ROADMAP_PROJECT="$2"
      shift # past argument
      shift # past value
      ;;
    --sprint-project)
      SPRINT_PROJECT="$2"
      shift # past argument
      shift # past value
      ;;
    -*|--*)
      echo "Unknown option $1"
      exit 1
      ;;
    *)
      POSITIONAL_ARGS+=("$1") # save positional arg
      shift # past argument
      ;;
  esac
done


# set script-specific variables
mkdir -p tmp
roadmap_milestones_file="./tmp/roadmap-milestones.json"
sprint_milestones_file="./tmp/sprint-milestones.json"
deliverable_options_file="./tmp/deliverable-options.json"
milestone_query=$(cat ./queries/get-project-milestones.graphql)
deliverable_query=$(cat ./queries/get-deliverable-options.graphql)

# print the parsed variables for debugging

# get all tickets from the product roadmap project with their
# milestone and their value for the deliverable column
echo "Exporting milestones and deliverables from the GitHub project: ${ORG}/${ROADMAP_PROJECT}"
gh api graphql \
 --paginate \
 --field login="${ORG}" \
 --field project="${ROADMAP_PROJECT}" \
 --field batch="${BATCH}" \
 -f query="${milestone_query}" \
 --jq ".data.organization.projectV2.items.nodes" |\
 # combine results into a single array
 jq --slurp 'add' |\
 # convert results into a map from milestone URL to its parent deliverable
 jq "[ .[]
    # select project items that have a deliverable and milestone set
    | select((.deliverable) and (.milestone))
    # map milestone URL to the name of the deliverable column value
    | {(.milestone.milestone.url): .deliverable.name} ]
    # combine list of objects into a single object
    | add" > $roadmap_milestones_file

# get id and name for the options in the deliverable column in the sprint board
# we'll use this to map the milestones to the deliverable value in that project
echo "Exporting deliverables options from the GitHub project: ${ORG}/${SPRINT_PROJECT}"
gh api graphql \
 --paginate \
 --field login="${ORG}" \
 --field project="${SPRINT_PROJECT}" \
 -f query="${deliverable_query}" \
 --jq "[ .data.organization.projectV2.field.options[] | {(.name): .id} ] | add" \
 > $deliverable_options_file

# get issues
echo "Exporting milestones and deliverables from the GitHub project: ${ORG}/${SPRINT_PROJECT}"
gh api graphql \
 --paginate \
 --field login="${ORG}" \
 --field project="${SPRINT_PROJECT}" \
 --field batch="${BATCH}" \
 -f query="${milestone_query}" \
 --jq ".data.organization.projectV2.items.nodes" |\
 # combine results into a single array
 jq --slurp 'add' |\
 # convert results into an array of objects with the following structure:
 # {
 #    milestone: "<milestone-url>",
 #    items: [
 #      {id: "<item-id>", deliverable: "<deliverable-name>"},
 #      {id: "<item-id>", deliverable: "<deliverable-name>"}
 #    ]
 # }
 jq "[ .[]
    # select project items that are open and have a deliverable and milestone set
    | select((.deliverable) and (.milestone) and (.status.name != \"${STATUS}\")) ]
    # group by milestone
    | group_by(.milestone.milestone.url)
    # reformat so it returns a list of objects with a milestone and items key
    | map(
        {
            milestone: .[0].milestone.milestone.url,
            items: map({id: .id, deliverable: .deliverable.name})
        }
    )" > $sprint_milestones_file
