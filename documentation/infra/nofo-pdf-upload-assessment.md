# NOFO Readability Calculator: upload availability assessment

Work for [#12568](https://github.com/HHS/simpler-grants-gov/issues/12568), items 4–5.
Initial source review dated October 2, 2026; bounded test plan updated November 2.
Status: **slow-upload test not run; plan for review**.
This document changes no infrastructure, application settings, or feature flags.
It does not establish deployed protection or complete release acceptance criteria.

## Source baseline and request path

Infrastructure baseline: [simpler-grants-gov a5445e9](https://github.com/HHS/simpler-grants-gov/tree/a5445e9).
Application baseline: [Builder 036d668](https://github.com/HHS/simpler-grants-pdf-builder/tree/036d6684fdd5af8463e6d0c4750979dd4181c1c6).
Confirm deployed image, effective settings, task count, and request path later;
these source revisions are not a runtime audit.

The NOFO service uses the shared ECS service module and its ALB. API Gateway
is disabled by the module default and NOFO does not override that setting;
S3 CDN is explicitly disabled. No request-buffering proxy is established by
this source path. Do not assume that the ALB buffers the entire upload before
assigning work to the application, or that a different service's API Gateway
limits apply to NOFO.

| Source | Observation | Boundary / unresolved question |
| --- | --- | --- |
| [ALB configuration](../../infra/modules/service/load_balancer.tf) | Connection idle timeout is 120 seconds | An inactivity timer, not a complete upload deadline; deployed value needs verification |
| [NOFO service](../../infra/nofos/service/main.tf), [module defaults](../../infra/modules/service/variables.tf) | Shared ALB/ECS path; API Gateway defaults off | Confirm actual routing and any upstream proxy before drawing runtime conclusions |
| [Builder Dockerfile](https://github.com/HHS/simpler-grants-pdf-builder/blob/036d6684fdd5af8463e6d0c4750979dd4181c1c6/Dockerfile) | Gunicorn: eight workers, timeout 89 seconds, no worker-class argument | Default sync workers unless overridden; worker timeout is not an edge rejection guarantee; eight is per container, not verified service capacity |
| [Pilot view](https://github.com/HHS/simpler-grants-pdf-builder/blob/036d6684fdd5af8463e6d0c4750979dd4181c1c6/nofos/bloom_nofos/views.py) | Default-off flag returns 503 before pilot multipart handling; enabled path installs a size handler before CSRF/form parsing | Flag-off requests cannot demonstrate enabled-path upload handling |
| [Pilot analyzer/upload handler](https://github.com/HHS/simpler-grants-pdf-builder/blob/036d6684fdd5af8463e6d0c4750979dd4181c1c6/nofos/nofos/pdf_readability.py) | File-chunk counter rejects above 15 MiB; StopUpload uses connection_reset=False; analysis subprocess timeout is 15 seconds | File bytes differ from total multipart request bytes; remaining input may be drained; analysis timeout excludes time spent receiving/parsing uploads |
| [Current managed WAF configuration](../../infra/modules/service/waf.tf) | SizeRestrictions_BODY action is overridden to Allow | Existing managed size rule is not a reliable 15 MiB rejection mechanism; verify effective priorities/actions later |

## Assessment: what the source does and does not establish

The source does not establish adequate slow-upload protection. AWS documents
that the ALB idle timeout measures periods without data; continued data can
keep an upload active. Gunicorn documents that synchronous workers require a
buffering proxy to protect against slow clients. Together with the source path,
this motivates investigation, not a claim that deployed workers are exhausted.
A single analysis slot bounds concurrent parsing, not requests waiting to upload.
The proposed per-IP WAF request rate rule also does not cap upload duration or
protect against several slow requests below its threshold.

The 15 MiB file limit is application-enforced. AWS WAF body inspection on an ALB
is fixed at 8,192 bytes. Oversize MATCH plus Block could reject bodies beyond that
inspection boundary, including legitimate PDFs well below 15 MiB; it cannot be
presented as precise 15 MiB enforcement. A Content-Length header size constraint
measures the header's byte length, not its numeric value. A claimed length alone
also does not establish the actual transferred byte count. No suitable edge
mechanism enforcing the intended limit was established by this review.

**Recommendation:** keep items 4–5 open. Do not change shared ALB timeouts,
Gunicorn workers, or WAF body-size handling based on this review alone. Evaluate
buffering with a total receive deadline/actual byte cap, application upload
handling, or a separate upload boundary after obtaining deployed facts. Any
proposal must account for normal staff document imports and shared resources.
Increasing workers alone does not demonstrate a solution to slow clients.

## Later verification: prerequisites, not actions authorized by this PR

Before live testing, agree a NOFO dev window, operator, observer, and recovery
contact. The operator must be able to inspect ALB/WAF/ECS and application signals,
stop client requests, and restore agreed settings. Builder deployment access is
not proof of AWS viewing or effective operator permissions. Agree a restricted
evidence location, baseline latency/error bounds, and explicit stop thresholds.
Confirm the actual task/image/settings and existing dev users before testing.
Do not use production, real NOFO documents, sensitive query strings, or public
log artifacts. Keep the pilot flag off during initial path/control checks.

An enabled-path upload test needs a separately agreed, time-limited dev flag
change and restoration. It is deferred, not authorized or executed here. A 503
while the flag is off is not evidence of file-size or analysis protections.
The current public disabled behavior is GET 200 / POST 403; the historical 503
references above describe the initial source baseline only.
PRs [#12661](https://github.com/HHS/simpler-grants-gov/pull/12661) and
[#12673](https://github.com/HHS/simpler-grants-gov/pull/12673) should be deployed
and their signals verified before relying on them during these tests.

## Proposed bounded procedure for that later window

For the slow-upload part of this procedure, use the narrower observation gate
and request limits below. The size-boundary tests in step 3 are a separate
follow-up; do not bundle them into the first slow-upload session.

1. Record the baseline: effective routing, image, worker settings, healthy task
   count, WAF actions, ordinary authenticated Builder latency/errors, and observer
   access. Confirm no testing starts until the operator agrees the window.
2. Use generated PDFs and valid multipart requests with the route's required CSRF
   token/cookie when enabled. Record actual file and total request sizes separately.
   Avoid malformed framing or sensitive filenames. Verify ordinary small upload
   behavior first; a CSRF rejection is not an upload protection result.
3. Test file sizes at 15 MiB minus one byte, exactly 15 MiB, and 15 MiB plus one
   byte. The small over-limit file tests rejection only; it does not prove bounded
   draining for arbitrarily large bodies. Use a single request at a time, a maximum
   file size of 15 MiB plus one byte, and a 30-second client deadline for this stage.
   A parser/page-count failure for a boundary fixture must be recorded separately
   from acceptance/rejection of file bytes.
4. With separate operator agreement, try one slow upload with a small synthetic
   file, no more than 120 seconds of client activity, no retries, and no concurrency
   escalation. Separately compare a continuously trickling body and an idle pause.
   Set an explicit client deadline and cancel at it; distinguish client cancellation
   from server termination. The operator chooses exact send/pause timing after
   checking effective timeouts. This limited probe does not establish full capacity.
5. Observe where the request is rejected, whether bytes still arrive/drain, worker
   timeout/restart events, and ordinary Builder impact. HTTP status or an ALB graph
   alone cannot establish that no worker was occupied. Do not intentionally exhaust
   eight workers or terminate tasks; those need a separate test plan and window.
6. Stop immediately on unexpected Builder latency/error growth beyond agreed
   thresholds, lost observability, an unexpected worker restart, or operator request.
   Cancel the client, run no automatic retries, restore any approved temporary flag
   change, and confirm normal service recovery. The WAF emergency block may prevent
   new requests; do not assume it cancels an upload already in progress.
7. Store dated results privately: source/deployed revisions, byte counts, elapsed
   times, transfer termination cause, status/rejection layer, observer findings,
   Builder impact, recovery, and unresolved limitations. Publish only a non-sensitive
   conclusion and evidence-owner/location reference. Update #12568 items 4–5 only
   when the evidence supports a reviewed decision; no boxes are completed here.

## Slow-upload observation gate and first test card

The immediate question is whether a slowly arriving body occupies a Builder web
worker, how it is released, and whether ordinary requests are affected. This is
not a capacity benchmark. Keep public uploads disabled during preparation; no
upload traffic, feature changes or worker termination are authorized by this plan.

### What existing access establishes

Read-only New Relic queries on November 2 confirmed that dev application and ALB
logs are searchable. For `entity.name = 'nofos-infra-dev'`,
`logtype = 'ecs-application'`, 00:00–21:30 UTC, the worker-lifecycle query returned
24 `Booting worker` records, zero `Worker exiting` records and zero
`WORKER TIMEOUT` records. These are text-match counts, not distinct workers, a
current worker count or proof that exit/timeout messages can never occur.
Known record delivery is established for startup messages only. No raw process
identifiers, log samples, IPs or document content are reproduced here.

The source still starts eight Gunicorn workers with an 89-second timeout and no
worker-class override. Builder's middleware timestamps request entry but logs
only after response/exception. The approved inspection reports service-level
CPU/memory and WAF counters; it does not expose an in-flight worker gauge,
stacks, ALB idle-timeout attributes or effective Gunicorn arguments.

| Observation | Available now | What it cannot establish alone |
| --- | --- | --- |
| New Relic application logs | Search/count request completion, worker startup and candidate timeout/exit messages | Which live worker is waiting for body bytes, or absence of unlogged restarts |
| New Relic ALB logs | Request/status/byte metadata and restricted raw-log access through the existing UI | Live worker occupation; parsed timing fields were not established in the earlier keyset query |
| Approved inspection | Deployed image/task configuration categories, service health and CPU/memory/WAF signals | An upload receive deadline, per-worker activity or actual body buffering |
| Separate-task runtime workflow (#13111) | Analysis limits, controlled timeout, synthetic cleanup and PostgreSQL admission | HTTP ingress, the normal Gunicorn workers or slow-body protection |

**Do not start the slow upload until worker observation is usable.** First
choose and review an existing live-worker inspection path, if available, or a
minimal dev-scoped observation change that records request entry *before body
parsing*, completion/abort and worker identity in restricted evidence. It must
not log uploaded bytes, filenames, cookies, headers, user identity or query
strings. Confirm delivery/latency of that signal with an ordinary request before
the slow test. This plan does not implement instrumentation, authorize ECS Exec
or assume the inspection role has container-execution access.

Without this signal, we can describe end-to-end behavior but must mark worker
occupation **inconclusive**. No 5xx, low CPU, a responsive health endpoint, a
missing log record or the client's timeout is sufficient evidence of protection.

### Entry and restoration decisions

Record these in #12568 before execution, without adding a new coordination
meeting solely because the environment is dev. Ben has confirmed dev is not in
active shared use. The executing operator and reviewer can use the existing
normal review/deployment path; role names are not a new staffing requirement.

- Record actual deployed Builder/infrastructure revisions, task health, effective
  worker count/class/timeout, ALB idle timeout and relevant WAF modes. The source
  values above are not substitutes for effective settings. Do not change WAF,
  worker counts, ALB attributes or infrastructure as part of the test itself.
- Choose the entry route and obtain explicit authorization for any temporary
  flag change. Prefer the restricted authenticated PDF route if its permissions,
  CSRF handling and multipart path are verified equivalent for this question.
  That does not establish signed-out routing or public WAF behavior. Otherwise
  obtain Ben's separate approval to enable the public route briefly; that flag
  makes the public endpoint available to others too, not just the test client.
- Record the exact flag's initial/effective state, who can restore it, a maximum
  **15-minute enabled window**, and the existing escalation path if restoration
  fails. Keep a usable admin session open. There is no automatic timed flag
  rollback. Verify the public flag stays false if using the authenticated path.
  The first test assumes the selected flag starts off; if it is already on,
  pause and agree its intended restoration state before proceeding.
- Select an approved restricted evidence location and observer with usable
  worker signals. Record cookies/authentication only in memory; never in command
  output, screenshots, source, issues or workflow artifacts. Security/privacy
  handling review remains deferred to its later release gate; use fictional PDFs.

### Proposed requests and stop conditions

Review these limits before execution. No script is dispatched by this document.
Do not improvise multipart framing or use a pathological PDF to create delay.

1. **Baseline:** over 60 seconds, send five GETs to `/health` and five to a fixed
   ordinary Builder page. Record their statuses and elapsed times. Stop before
   uploads if any fails, or if baseline latency is unstable. Retrieve a valid
   CSRF token/session, then send one ordinary small supported synthetic PDF with
   a 30-second client deadline. A login redirect, disabled response or CSRF error
   does not establish that the enabled upload path was reached.
2. **Continuous slow body:** only after the observation gate passes, send one
   valid multipart request containing the same small fictional PDF. Cap the
   whole multipart body at 64 KiB, send at most 32 body bytes per second, use one
   connection with no retry/redirect following, and a **110-second total client
   deadline**. Record the actual bytes handed to the socket and any server-side
   close/rejection; transmission speed is not proof of downstream consumption.
3. **Idle comparison:** only if the prior request has fully ended, worker
   recovery is confirmed and no stop condition occurred, send at most one more
   request: send headers and one small body chunk, pause for up to 100 seconds,
   and enforce the same 110-second total deadline. Do not extend the test to
   cross an unobserved timeout boundary. A still-open request at the client
   deadline is inconclusive about a later server cutoff.
4. During steps 2–3, use at most one ordinary-page or health GET every five
   seconds, alternating endpoints, with a five-second timeout. Stop the upload
   and the entire test on any monitoring failure, unexpected 5xx, any observed
   worker timeout/restart, or two consecutive probes slower than the greater of
   two seconds or three times the baseline median. A worker timeout may be an
   outcome of this test; it ends the session rather than authorizing escalation.
   Inspect that result before considering the idle comparison or another test.
5. Always stop the client and restore the selected flag immediately after the
   session, on a stop condition or before the 15-minute window ends. Cancellation
   alone does not prove a worker released the request. Confirm worker recovery,
   stored/effective disabled state, and five ordinary health/page checks. If the
   service is unresponsive, use the recorded escalation path. The WAF off switch
   can prevent new requests; it is not assumed to cancel an existing transfer.

**Whole-session bounds:** at most three upload requests, one at a time; 64 KiB
per complete multipart body; 80 total HTTP requests including auth/CSRF and
health checks; no automatic retries, redirects, parallel slow uploads, deliberate
worker/task kills or production traffic. Budget the baseline, at most 44
during-test probes and restoration before starting. Stop at any ceiling even
if the result is inconclusive. Account for request count/clock in the eventual
reviewed client implementation; this document does not supply a runnable client.

Allow a bounded five-minute read-only log-publication interval after restoring
the flag. Existing dev error alarms could send notifications; leave them enabled
and label the window as a controlled test. Log delay is not permission to resend
uploads or extend the enabled window.

### Outcome and decision

Record worker entry/exit evidence, transfer timing/bytes, HTTP response and
rejection layer, ordinary-route impact and recovery. ALB timing needs careful
interpretation: with WAF attached, AWS documents that POST receive time can be
included in request processing time; a high duration does not by itself identify
worker residence. Client cancellation, server enforcement and Gunicorn killing
a worker are distinct outcomes.

- If a worker waits on the slow body or is killed for timing out, document that
  availability cost. Do not present worker replacement as edge-side protection.
  Propose a NOFO-scoped buffering/receive-deadline boundary or another reviewed
  mitigation, considering ordinary document imports before changing defaults.
- If a verified upstream control rejects the request before it reaches a
  worker, record the exact control and configured bound. A single-client check
  still does not establish saturation resistance or shared-office-IP fairness.
- If attribution is missing, retain an **inconclusive** result and fix the
  observation gap instead of increasing load.

The infrastructure reviewer evaluates the evidence and recommendation; Ben
does not need to choose a timeout or worker configuration. Keep #12568 items
4–5 and production enablement open until the protection/remaining-risk decision
is recorded. Finishing this plan or merging its PR does not approve the test.

## Decision record to fill after verification

| Question | Current status | Evidence needed |
| --- | --- | --- |
| Is slow-upload protection sufficient? | Not established | Effective buffering/deadline behavior and bounded dev observations |
| Is the intended size limit enforced before a worker handles the body? | Not established; app file limit exists | Identified rejection layer and actual transfer/worker evidence |
| What change is required? | Deferred | Reviewed impact and proposed NOFO-specific scope |
| Who owns further testing and response? | To be agreed | Named operator, observer, recovery contact, and scheduled window |

## Primary references

- [AWS ALB idle-timeout semantics](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/edit-load-balancer-attributes.html)
- [AWS WAF body-inspection limits](https://docs.aws.amazon.com/waf/latest/developerguide/web-acl-setting-body-inspection-limit.html)
- [AWS WAF oversize handling](https://docs.aws.amazon.com/waf/latest/developerguide/waf-oversize-request-components.html)
- [Gunicorn worker design](https://docs.gunicorn.org/en/stable/design.html)
- [Gunicorn timeout setting](https://docs.gunicorn.org/en/stable/settings.html#timeout)
- [Django upload handlers](https://docs.djangoproject.com/en/5.2/ref/files/uploads/)
