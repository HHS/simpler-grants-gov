#! /bin/bash
# Usage: ./scripts/close-issues-in-done-col.sh --dry-run
# Closes issues that are in the "Done" column on a project but still open in the repo

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
    --project)
      PROJECT="$2"
      shift # past argument
      shift # past value
      ;;
    --status)
      STATUS="$2"
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
to_close_file="./tmp/open-issues-that-are-done.txt"
query=$(cat ./queries/get-project-items.graphql)

# print the parsed variables for debugging
echo "Finding open issues in the '${STATUS}' column of GitHub project: ${ORG}/${PROJECT}"

# get all tickets from the project with their
# URL, open/closed state in the repo, and status on the project
gh api graphql \
 --paginate \
 --field login="${ORG}" \
 --field project="${PROJECT}" \
 --field batch="${BATCH}" \
 -f query="${query}" \
 --jq ".data.organization.projectV2.items.nodes" |\
 # combine results into a single array
 jq --slurp 'add' |\
 # isolate the URLs of the issues that are marked "Done" in the project
 # but still open in the repo, and use --raw-ouput flag to remove quotes
 jq --raw-output "
 .[]
 | select((.status.name == \"${STATUS}\") and (.issue.state == \"OPEN\"))
 | .issue.url" > $to_close_file  # write output to a file

# iterate through the list of URLs written to the to_close_file
# and close them with a comment indicating the reason for closing
comment="Beep boop: Automatically closing this issue because it was marked as '${STATUS}' "
comment+="in https://github.com/orgs/${ORG}/projects/${PROJECT}. This action was performed by a bot."
while read URL; do
  if [[ $DRY_RUN == "YES" ]];
  then
    echo "Would close issue with URL: ${URL}"
  else
    echo "Closing issue with URL: ${URL}"
    gh issue close $URL \
    --comment "${comment}"
  fi
done < $to_close_file
