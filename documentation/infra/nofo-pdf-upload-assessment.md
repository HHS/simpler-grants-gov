# NOFO PDF pilot: upload availability assessment

Work for [#12568](https://github.com/HHS/simpler-grants-gov/issues/12568), items 4–5.
Source review dated October 2, 2026. Status: **preparation only; no dev tests run**.
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
PRs [#12661](https://github.com/HHS/simpler-grants-gov/pull/12661) and
[#12673](https://github.com/HHS/simpler-grants-gov/pull/12673) should be deployed
and their signals verified before relying on them during these tests.

## Proposed bounded procedure for that later window

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
