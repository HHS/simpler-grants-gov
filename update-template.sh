#!/bin/bash
# -----------------------------------------------------------------------------
# This script updates template-infra in your project. Run
# This script from your project's root directory.
#
# Positional parameters:
#   TARGET_VERSION (optional) – the version of template-infra to upgrade to.
#     Defaults to main.
# -----------------------------------------------------------------------------
set -xeuo pipefail

TARGET_VERSION=${1:-"main"}

CURRENT_VERSION=$(cat .template-version)

echo "Clone template-infra"
rm -rf template-infra
git clone https://github.com/navapbc/template-infra.git

echo "Creating patch"
cd template-infra
git checkout "$TARGET_VERSION"

# Get version hash to update .template-version after patch is successful
TARGET_VERSION_HASH=$(git rev-parse HEAD)

# Note: Keep this list in sync with the files copied in install-template.sh
git diff "$CURRENT_VERSION" "$TARGET_VERSION" -- .github bin docs infra Makefile .dockleconfig .grype.yml .hadolint.yaml .trivyignore > update.patch
cd -

echo "Applying patch"
# Note: Keep this list in sync with the removed files in install-template.sh
EXCLUDE_OPT="--exclude=.github/workflows/template-only-*"
git apply --3way "$EXCLUDE_OPT" --allow-empty template-infra/update.patch
g
echo "Saving new template version to .template-infra"
echo "$TARGET_VERSION_HASH" > .template-version

echo "Clean up template-infra folder"
rm -fr template-infra
