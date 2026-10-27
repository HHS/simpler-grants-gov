# Readability Calculator preparation and short verification checklist

Work for [#12568](https://github.com/HHS/simpler-grants-gov/issues/12568) and Builder
[#970](https://github.com/HHS/simpler-grants-pdf-builder/issues/970)/
[#971](https://github.com/HHS/simpler-grants-pdf-builder/issues/971).
This kit is preparation, not evidence that shared-environment tests have run.
The public route remains disabled until its separate release decision.

## What is ready

- Fictional PDF uploads are in
  [scripts/tests/fixtures/readability](../../scripts/tests/fixtures/readability/).
  Download the files themselves (GitHub's **Raw** download), not the HTML preview.
- The manifest records sizes, hashes, expected behavior and outcomes. Each file
  is small; no stress, malformed-parser exploitation or resource-exhaustion
  fixture is included.
- Private email subscription support is available through an optional encrypted
  AWS parameter. No parameter path, real recipient or new alarm activation is
  selected in any environment by this change. See
  [private email setup](nofo-private-alert-email.md).
- The [read-only inspection PR #12957](https://github.com/HHS/simpler-grants-gov/pull/12957)
  is separate. After review and merge, use its result to select only the missing
  live checks below.

## Short checklist

Record date, environment, actual deployed application commit, infrastructure
revision, tester, result and evidence link. Use **not run** for any omitted check;
never infer a pass from merged code or an empty dashboard.

### 1. Before making requests

- [ ] Identify the exact target URL/environment. The deployment menu's **dev**
  selection resolves to **infra-dev**. Start with read-only inspection and reuse
  dated evidence that still applies to the deployed version.
- [ ] Record upload and recording states. Verify public/authenticated usage-record
  retention cutoffs are unset and no record-deletion job is active. The inspection
  workflow reads selected task environment settings, not database-stored flags or
  scheduled jobs; gaps need separate checks.
- [ ] Use the authorized authenticated route if that is the approved test path.
  Public uploads require separately agreed temporary dev enablement/restoration.
  Authenticated smoke results do not prove public routing or WAF behavior.

### 2. Ordinary upload checks (one request at a time)

| File | Expected result | Expected recorded outcome if recording is on |
| --- | --- | --- |
| `synthetic-nofo-supported.pdf` | Report with generic/untagged-PDF extraction caveats; copy and print/save work | `success` |
| `synthetic-unrelated.pdf` | Unsupported-document message | `format_unsupported` |
| `synthetic-no-text.pdf` | Cannot determine format from extractable text; shapes only | `format_indeterminate` |
| `synthetic-encrypted.pdf` | Password-protected PDF rejected; do not enter a password | `encrypted` |
| `synthetic-invalid.pdf` | Invalid PDF rejected; deliberately not valid PDF bytes | `invalid_pdf` |

- [ ] Verify each response and, when recording is on, exactly one matching
  content-free outcome in the metrics-viewer dashboard. Confirm the upload-route
  source and viewer access rules. Preserve the existing report caveats; numeric
  score equality is not a requirement of this smoke test.
- [ ] Save one synthetic report through the browser and inspect its pages. No
  document text, filename or score should appear in outcome records. The marker
  `SYNTHETIC-NOFO-BODY-CHECK-2026` and fixture filenames can be used for restricted
  log/content checks; never upload real drafts for verification.

### 3. Email setup and receipt (separate from uploading)

- [ ] Provision the selected address privately, review/apply the environment's
  parameter-path setting and confirm the AWS email subscription from the team
  inbox. Subscribing can route existing generic Builder alarms even while the
  calculator-specific actions remain off.
- [ ] Conduct a coordinated synthetic delivery/recovery check. A direct SNS test
  proves topic delivery only; a controlled alarm transition is needed to verify
  alarm-to-topic routing. Restore any changed alarm state/configuration and record
  what was actually tested. No test sends are performed by this kit.
- [ ] Explicitly enable calculator alarm actions only after routing and recipient
  readiness are confirmed. Record who receives and investigates alerts.

### 4. Only if existing evidence does not cover it

- [ ] Coordinate rate enforcement and emergency block/restoration using the
  [existing bounded WAF procedure](nofo-pdf-readability-waf.md). Keep unrelated
  Builder pages available and restore the agreed modes. Empty requests can test
  WAF without enabling document analysis.
- [ ] Verify temporary-file cleanup after success, handled error and timeout.
  Use an agreed deterministic timeout method; do not invent a pathological PDF
  to force resource exhaustion. Task-definition storage declarations alone do
  not prove cleanup.
- [ ] Coordinate any interrupted-worker/task cleanup check before performing it.
  Record whether files survive and the actual cleanup/task-replacement behavior.
- [ ] Inspect relevant deployed logging destinations for the synthetic markers,
  identify any unexpected document/identity data, and record remaining scope
  limitations. Keep detailed runtime configuration and raw logs restricted.

Restore test flags/settings, link results to #12568/#970/#971 and fix demonstrated
gaps. This checklist does not authorize production tests or public launch.
Indefinite retention of content-free usage records does not extend temporary
uploaded-file, log, crash-data or backup retention.

## Existing contact path

Use the engineering maintainers in [MAINTAINERS.md](../../MAINTAINERS.md) and the
review-maintainer guidance in [CONTRIBUTING.md](../../CONTRIBUTING.md#review-assignment).
The requester can reach them in Slack. Prasanth
([@prasnava](https://github.com/prasnava)) is listed as an engineering maintainer
and was already identified in #12568 as an initial routing contact. Ask an existing
maintainer to route a concrete infrastructure problem if the usual contact is
unavailable. The Community Members section recognizes contributors; it is not
an incident roster.

These are documented contact candidates, not an accepted on-call assignment,
response-time guarantee or independently verified AWS-access claim. Confirm the
existing primary/fallback support arrangement before relying on automated alerts;
no new team or support process is required if the current one covers Builder.
No maintainer has been contacted or assigned operating responsibility by this PR.

## Rebuild the fixtures (optional, offline)

The committed files are ready to use; no generation is required for browser tests.
To rebuild in an isolated Python environment:

```sh
python -m pip install -r scripts/readability_fixture_requirements.txt
python scripts/build_readability_fixtures.py --output-dir output/pdf/readability-fixtures
python -m unittest discover -s scripts/tests -p test_readability_fixtures.py -v
```

The generator does not contact any service. The encrypted fixture uses a public
synthetic password (`synthetic-test-only`) and contains no sensitive information;
it exists solely to verify rejection. Encrypted bytes can vary when regenerated;
the manifest records the actual generated hashes. Fixtures were visually checked
and exercised against the local Builder analyzer; that is not deployed evidence.
Word uploads, upload limits, concurrency, slow-upload assessment and broader
accuracy/calibration tests retain their separate existing coverage/requirements.
