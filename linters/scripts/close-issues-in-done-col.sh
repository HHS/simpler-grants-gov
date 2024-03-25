#! /bin/bash
# Usage: ./scripts/close-issues-in-done-col.sh --dry-run
# Closes issues that are in the "Done" column on a project but still open in the repo

# set the variables
mkdir -p tmp
to_close_file="./tmp/open-issues-that-are-done.txt"
query=$(cat ./queries/get-project-items.graphql)

# print the parsed variables for debugging
echo "Finding open issues in the ${STATUS} column of GitHub project: ${ORG}/${PROJECT}"

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
while read URL; do
  echo "Would close issue with URL: ${URL}"
#   gh issue close $URL \
#   --comment "Closing because issue was marked as '${STATUS}' in https://github.com/orgs/${ORG}/projects/${PROJECT}"
done < $to_close_file
