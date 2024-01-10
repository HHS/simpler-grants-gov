#!/bin/bash

# To make things simpler, ensure we're in the repo's root directory (one directory up) before
# running, regardless where the user is when invoking this script.

# Grab the full directory name for where this script lives.
SCRIPT_DIR=$(readlink -f "$0" | xargs dirname)

# Move up to the root since we want to do everything relative to that. Note that this only impacts
# this script, but will leave the user wherever they were when the script exists.
cd "${SCRIPT_DIR}/.." >/dev/null || exit 1


LINK_CHECK_CONFIG=".github/workflows/markdownlint-config.json"

# Recursively find all markdown files (*.md) in this directory. Pass them in as args to the lint
# command using the handy `xargs` command.
find . -name \*.md -print0 | xargs -0 -n1 npx markdown-link-check --config $LINK_CHECK_CONFIG
