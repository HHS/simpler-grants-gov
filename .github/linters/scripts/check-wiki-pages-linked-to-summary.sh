#! /bin/bash
# Usage: ./scripts/check-wiki-pages-linked-to-summary.sh
# Checks that all pages in the documentation/wiki/ sub-directory are linked to SUMMARY.md

REPO_ROOT="../.."
WIKI_DIR="${REPO_ROOT}/documentation/wiki"
TEMP_DIR="./tmp"
WIKI_FILES="${TEMP_DIR}/wiki-files.txt"
SUMMARY_FILES="${TEMP_DIR}/summary-files.txt"
MISSING_FILES="${TEMP_DIR}/missing-from-summary.txt"

# list all of the markdown files in the wiki directory
find "${WIKI_DIR}" -name "*.md" |\
 # make file paths relative to the root of the wiki directory
 sed -E "s|${WIKI_DIR}/(.*)|\1|" |\
 # filter out the SUMMARY.md file
 grep -Ev '(SUMMARY.md)' |\
 # sort the files alphabetically and write to a temporary file
 sort > $WIKI_FILES

# list all of the markdown files linked in the SUMMARY.md file
grep -oE '\((.*\.md)\)' "${WIKI_DIR}/SUMMARY.md" |\
 # remove the extra parantheses around the markdown files
 sed -E "s|\((.+)\)|\1|" |\
 # sort the files alphabetically and write to a temporary file
 sort > $SUMMARY_FILES

# find files that are in the wiki but not in the summary
comm -2 -3 $WIKI_FILES $SUMMARY_FILES > $MISSING_FILES

# if there are missing files exit with a non-zero code and print them
if [[ -z "$(cat ${MISSING_FILES})" ]]; then
    echo "All files added to summary"
    exit 0
else
    echo "The following files need to be added to documentation/wiki/SUMMARY.md:"
    cat $MISSING_FILES
    exit 1
fi
