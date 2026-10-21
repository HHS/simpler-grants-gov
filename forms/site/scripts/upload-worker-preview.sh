#!/usr/bin/env bash
set -euo pipefail

# Upload a new preview version of the form library Worker and report its preview URL.
#
# `versions upload` uploads a new, undeployed version to the Worker named in
# `wrangler.jsonc` instead of creating a Worker per PR, and `--preview-alias` points
# `<ALIAS>-<WORKER>.<SUBDOMAIN>.workers.dev` at the latest version for that alias.
# Cloudflare keeps the 1000 most recently deployed aliases and each PR reuses one,
# so previews need no cleanup step.
# See https://developers.cloudflare.com/workers/configuration/previews/
#
# Usage, from forms/site/ after `npm run build`:
#   scripts/upload-worker-preview.sh <alias> <message>
#
# Exit codes:
#   0 = version uploaded and preview URL found
#   1 = bad arguments, wrangler failure, or no preview URL in wrangler's output

ALIAS="${1:?usage: upload-worker-preview.sh <alias> <message>}"
MESSAGE="${2:?usage: upload-worker-preview.sh <alias> <message>}"

if [[ ! -d dist ]]; then
  echo "::error::No dist/ directory. Did the build run?"
  exit 1
fi

# The label wrangler prints before the alias URL. It's the only machine-readable handle
# on the URL, so a reworded label has to fail loudly rather than yield an empty result.
LABEL="Version Preview Alias URL"

# `npx --yes wrangler@4` runs wrangler without a full `npm ci`, pinned to the major
# version in this package's devDependencies. tee keeps wrangler's output in the CI log
# while capturing it for parsing, and pipefail (above) fails the script if wrangler fails.
npx --yes wrangler@4 versions upload \
  --preview-alias "$ALIAS" \
  --message "$MESSAGE" 2>&1 | tee upload.log

url=$(grep -F "$LABEL" upload.log | grep -oE 'https://[^[:space:]]+' | head -n1 || true)
if [[ -z "$url" ]]; then
  echo "::error::No '$LABEL' URL in wrangler's output. If the upload succeeded," \
    "wrangler likely changed this log line; update LABEL in $(basename "$0")."
  exit 1
fi

echo "Preview URL: $url"
echo "url=$url" >>"${GITHUB_OUTPUT:-/dev/null}"
