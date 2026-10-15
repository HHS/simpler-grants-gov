# Authenticated PDF readability pilot: production recording

Work for [#12698](https://github.com/HHS/simpler-grants-gov/issues/12698).
Application implementation: [Builder PR #1035](https://github.com/HHS/simpler-grants-pdf-builder/pull/1035).

The production override in `infra/nofos/app-config/prod.tf` enables content-free
usage recording when the deployed Builder version supports the setting. Records
contain timestamps, upload source, outcome codes, HTTP status and processing
duration. Uploaded PDFs, document contents and readability scores are not saved.
Authenticated retention is left unset: records have no automatic expiration and
no authenticated cleanup schedule is required for this pilot.

## Deployment and verification

1. Merge and deploy a Builder revision containing #1035. In this repository,
   run **Deploy NOFOs** (`.github/workflows/cd-nofos.yml`) with environment `prod`
   and that Builder version. Use a repository revision containing the production
   override. The pipeline applies the NOFO service configuration during deployment.
2. Confirm the production service environment contains
   `AUTHENTICATED_PDF_READABILITY_ATTEMPT_RECORDING_ENABLED=true`, with authenticated
   retention unset. Review the production infrastructure plan before applying.
3. Verify applicable upload safeguards using the application's rollout guide.
   In production Django admin, approve participants using **Can use PDF readability
   pilot** and reviewers using **Can view metrics**. These permissions are separate.
4. Enable `HHS_NOFO_AUTHENTICATED_PDF_METRICS_PILOT_ENABLED` in Constance. Leave
   the public `HHS_NOFO_PDF_METRICS_PILOT_ENABLED` switch off.
5. Using approved test documents, verify a successful and a handled unsuccessful
   authenticated upload appear under the Authenticated source filter at
   `/nofos/metrics/readability-pilot`. Do not post PDFs or report contents in
   public validation evidence.

Merging this infrastructure change triggers the existing development deployment
workflow; production deployment remains manual. Other environments and public
recording settings are unchanged. The recording setting does not grant access
or enable uploads by itself.

## Pausing the pilot

Disable the authenticated Constance upload switch to pause uploads immediately.
To stop recording, change the production recording override to `"false"` and
redeploy. Existing authenticated usage records remain available. Turning off
recording does not itself prevent participant uploads.
