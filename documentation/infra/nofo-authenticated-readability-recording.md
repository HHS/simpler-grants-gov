# NOFO Readability Checker: production usage recording

Work for [#12698](https://github.com/HHS/simpler-grants-gov/issues/12698) and
[#13403](https://github.com/HHS/simpler-grants-gov/issues/13403).
Application changes: [Builder PR #1035](https://github.com/HHS/simpler-grants-pdf-builder/pull/1035)
added recording; [Builder PR #1368](https://github.com/HHS/simpler-grants-pdf-builder/pull/1368)
moved signed-in users to the single checker URL.

The Readability Checker runs at one URL, `/readability-checker/`, for signed-in
and signed-out users. Each upload attempt can be saved as a content-free usage
record: timestamp, label, file category, outcome code, HTTP status and processing
duration. Uploaded documents, document contents and readability scores are not
saved. The label records whether the person was signed in:

| Label | Recording setting | Production |
| --- | --- | --- |
| `authenticated` (signed in) | `AUTHENTICATED_PDF_READABILITY_ATTEMPT_RECORDING_ENABLED` | `"true"` in `infra/nofos/app-config/prod.tf` |
| `public` (signed out) | `PDF_READABILITY_ATTEMPT_RECORDING_ENABLED` | Not set (default off) |

Both settings are environment variables read at startup, so changing one needs a
deployment. Retention is left unset for both: records have no automatic
expiration and no cleanup schedule is required. Recording doesn't grant access
or enable uploads; two Constance switches control who can upload.

Before Builder #1368, `authenticated` meant uploads through the restricted
`/nofos/readability-checker/` pilot route, and `public` included signed-in people
who used the public page.

## Signed-out recording stays off until public launch

Leave `PDF_READABILITY_ATTEMPT_RECORDING_ENABLED` off while the public checker is
off. With it on, the application would record signed-out POSTs that it turns
away as `disabled`, such as a stale form or a direct request, even though no
document can be analyzed.

As part of the public launch, add
`PDF_READABILITY_ATTEMPT_RECORDING_ENABLED = "true"` to
`service_override_extra_environment_variables` in `prod.tf`, deploy, and confirm
it before turning on `HHS_NOFO_PDF_METRICS_PILOT_ENABLED`. If it's found set in
production outside Terraform, turn it off until launch. Check the deployed value
with the [readability inspection workflow](nofo-readability-inspection.md), which
reports `public_recording_environment`.

## Deployment and verification

1. Deploy the Builder revision through **Deploy NOFOs**
   (`.github/workflows/cd-nofos.yml`) with environment `prod`. The pipeline
   applies the NOFO service configuration during deployment.
2. Confirm the production service environment contains
   `AUTHENTICATED_PDF_READABILITY_ATTEMPT_RECORDING_ENABLED=true`, with retention
   unset. Review the production infrastructure plan before applying.
3. Signed-in users don't need a pilot permission; Builder #1368 removed it. Grant
   reviewers **Can view metrics** in production Django admin to see the usage page.
4. With `HHS_NOFO_AUTHENTICATED_PDF_METRICS_PILOT_ENABLED` on and the public
   `HHS_NOFO_PDF_METRICS_PILOT_ENABLED` switch off, sign in and use approved test
   documents. Verify a successful and a handled unsuccessful upload appear under
   the Authenticated source filter at `/nofos/metrics/readability-checker-usage`.
   Do not post documents or report contents in public validation evidence.

Merging an infrastructure change here triggers the existing development deployment
workflow; production deployment remains manual.

## Pausing

Constance switch changes take effect immediately, without a deployment:

- To pause all uploads, turn off both `HHS_NOFO_PDF_METRICS_PILOT_ENABLED` and
  `HHS_NOFO_AUTHENTICATED_PDF_METRICS_PILOT_ENABLED`. While the public switch is
  on, everyone can upload whatever the signed-in switch is set to; while the
  signed-in switch is on, signed-in users can still upload.
- To pause only signed-out uploads, turn off the public switch and leave the
  signed-in switch on.

To stop
recording, change the production recording override to `"false"` and redeploy.
Existing usage records remain available. Turning off recording does not itself
prevent uploads.
