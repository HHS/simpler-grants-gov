# Find Observability Audit: Dashboards and Business Metrics

> **Scope:** Search endpoints, OpenSearch performance, opportunity view endpoints, saved opportunity endpoints, saved search endpoints, organization endpoints (all Find-related APIs)

---

## Table of Contents

1. [Existing New Relic Dashboards](#1-existing-new-relic-dashboards)
2. [Default APM Monitoring (Auto-Instrumented)](#2-default-apm-monitoring-auto-instrumented)
3. [Existing Custom Instrumentation](#3-existing-custom-instrumentation)
4. [Existing Business Metrics](#4-existing-business-metrics)
5. [Existing Metabase Dashboards](#5-existing-metabase-dashboards)
6. [Gaps Identified](#6-gaps-identified)
7. [Recommendations](#7-recommendations)

---

## 1. Existing New Relic Dashboards

> **Note:** All dashboards below are manually configured in the NR UI — none are defined as code (no Terraform NR provider, no dashboard JSON/HCL in `infra/`). This was confirmed during the codebase audit and is surfaced as a gap in [Section 6](#6-gaps-identified).

### 1.1 Search Parameters  - Find-Specific

**Purpose:** Dedicated search intent analysis dashboard.

**Widgets:**
- **Most Frequent Search Terms** — table of top queries (e.g., "Transportation", "Robotics", "Healthcare safety")
- **Recent Searches (Dev/Staging)** — live stream of recent search queries for debugging
- **Search Parameter Breakdown** — query param usage patterns

**Screenshot:**

![Search Parameters dashboard](screenshots/nr-search-parameters.png)

---

### 1.2 User/Usage Metrics  - Find-Specific

**Purpose:** Business engagement metrics including search and user activity.

**Screenshot (User/Usage Metrics tab):**

![User/Usage Metrics dashboard](screenshots/nr-user-usage-metrics.png)

---

### 1.3 API Dashboard  - Find-Relevant

**Purpose:** Technical health monitoring for all API endpoints, with dedicated tabs for opportunity and user endpoints.

**Screenshot:**

![API Dashboard](screenshots/nr-api-dashboard.png)

---

### 1.4 Browser Overview  - Find-Relevant

**Purpose:** Frontend performance and traffic analysis across all pages.

**Screenshot:**

![Browser Overview dashboard](screenshots/nr-browser-overview.png)

---

### 1.5 FE Monitoring

**Purpose:** Frontend performance diagnostics.

**Screenshot:**

![FE Monitoring dashboard](screenshots/nr-fe-monitoring.png)

---

### 1.6 Apply Metrics

**Purpose:** Tracks the downstream application funnel after users find an opportunity.

**Tabs:** Opportunity View, Competition View, Form View

**Key widgets:** Application starts/submissions, submission issues, attachment counts.

**Relevance:** Monitors the primary conversion action (applying) that follows a successful Find experience.

**Screenshot:**

![Apply Metrics dashboard](screenshots/nr-apply-metrics.png)

---

### 1.7 Error Monitoring

**Purpose:** Health regression identification and error triage.

**Key widgets:**
- **Top Error Messages:** pie chart of error types including "Not Found" errors for opportunities and search validation errors
- **Log Anomalies Trend:** error spike detection over time
- **Errors By Container:** distribution across api-dev (446), api-staging (446), api-training (37)
- **Application Errors (ErrorTrace):** per-minute error rate timeseries

**Relevance:** Helps diagnose issues where search or opportunity pages fail for users.

**Screenshot:**

![Error Monitoring dashboard](screenshots/nr-error-monitoring.png)

---

### 1.8 Program Metrics

**Purpose:** Operational incident response tracking.

**Key widgets:** Incident acknowledgement times, reaction times in minutes.

**Relevance:** Indirect — focused on operational support rather than user-facing Find functionality.

**Screenshot:**

![Program Metrics dashboard](screenshots/nr-program-metrics.png)

---

## 2. Default APM Monitoring (Auto-Instrumented)

New Relic APM is enabled for all non-local environments and automatically provides transaction-level data for all Find endpoints. The following is available out-of-the-box without any custom instrumentation:

### What NR APM Provides for Find Endpoints

| Metric | Description |
|--------|-------------|
| Transaction throughput | Requests/min per endpoint |
| Response time (avg, p95, p99) | Latency distribution per endpoint |
| Error rate | Errors per endpoint |
| Apdex score | User satisfaction index |
| Database query time | PostgreSQL query performance |
| External service calls | OpenSearch query latency |
| Transaction traces | Detailed traces for slow requests (>apdex_f) |
| Distributed tracing | Cross-service request flow (API only) |
| SQL explain plans | For queries >0.5s |

### Configuration Details

Source: [`api/newrelic.ini`](../../api/newrelic.ini)

Key settings:
- `transaction_tracer.enabled = true`
- `transaction_tracer.transaction_threshold = apdex_f`
- `transaction_tracer.record_sql = obfuscated`
- `transaction_tracer.stack_trace_threshold = 0.5`
- `transaction_tracer.explain_enabled = true`
- `error_collector.enabled = true`
- `error_collector.ignore_status_codes = 401 402 403 404 405 406 415 416 422`
- `distributed_tracing.enabled = true`
- `strip_exception_messages.enabled = true` (PII protection)
- `application_logging.enabled = false` (logs forwarded via FluentBit sidecar)

### Find-Related Endpoints Covered by APM

| Endpoint | Route | Method |
|----------|-------|--------|
| Search opportunities | `/v1/opportunities/search` | POST |
| Get opportunity | `/v1/opportunities/{opportunity_id}` | GET |
| Get opportunity (legacy) | `/v1/opportunities/legacy/{legacy_opportunity_id}` | GET |
| Save opportunity | `/v1/users/{user_id}/saved-opportunities` | POST |
| Delete saved opportunity | `/v1/users/{user_id}/saved-opportunities/{opportunity_id}` | DELETE |
| List saved opportunities | `/v1/users/{user_id}/saved-opportunities` | GET |
| Save search | `/v1/users/{user_id}/saved-searches` | POST |
| Delete saved search | `/v1/users/{user_id}/saved-searches/{saved_search_id}` | DELETE |
| List saved searches | `/v1/users/{user_id}/saved-searches` | GET |
| Update saved search | `/v1/users/{user_id}/saved-searches/{saved_search_id}` | PUT |
| Search organizations | `/v1/organizations/search` | POST |
| Search agencies | `/v1/agencies` | POST |

---

## 3. Existing Custom Instrumentation

### 3.1 Backend: Structured Logging

The search service (`api/src/services/opportunities_v1/search_opportunities.py`) emits one structured log:

```python
logger.info("Querying search index alias %s", index_alias, extra={"search_index_alias": index_alias})
```

This log is forwarded to both New Relic Logs and CloudWatch via FluentBit, but contains no business-level information (no query text, filter details, result counts, etc.).

### 3.2 Frontend: New Relic Browser Custom Attributes

[`SearchAnalytics.tsx`](../../../frontend/src/components/search/SearchAnalytics.tsx) sets NR browser custom attributes for search parameters on every search page load:

```typescript
// For each search query parameter:
setNewRelicCustomAttribute(key, value || "");
// Results in NR attributes like: search_param_query, search_param_status, etc.
```

This allows querying NR Browser for which search parameters users are using, but:
- Does not track result counts or response times
- Does not track individual search sessions
- Has a known cleanup timing issue (attributes may persist during route transitions)
- Only covers search pages, not opportunity views or saved items

### 3.3 Frontend: Google Analytics Events

The frontend sends two GA events related to Find:

| Event | Location | Data Sent |
|-------|----------|-----------|
| `search_attempt` | `SearchAnalytics.tsx` | Filters (JSON, excludes query text and page) |
| `search_term` | `useSearchParamUpdater.ts` | Search query value |

### 3.4 Log Forwarding Pipeline

[`fluentbit/fluentbit.yml`](../../../fluentbit/fluentbit.yml) configures a FluentBit sidecar that:

1. Receives logs via TCP/forward protocol
2. Parses JSON log fields and merges them to the record level
3. Truncates large SQL parameter lists via Lua script
4. Forwards to **three destinations**: New Relic Logs, CloudWatch, and stdout

This means all structured log attributes (from Python `extra={}` kwargs) are queryable in NR Logs, but as noted above, very little business-level data is being logged for Find endpoints.

---

## 4. Existing Business Metrics

### Summary: No Dedicated Find Business Metrics Exist

After auditing the entire codebase, **no explicit business metrics are being tracked for Find functionality** beyond the basic frontend analytics described above. Specifically:

| Metric Category | Tracked? | Details |
|-----------------|----------|---------|
| Search volume (total searches) | No dedicated tracking | Only derivable from NR APM transaction counts for the search endpoint |
| Popular search queries | No | Query text is not logged or sent to NR from the API |
| Zero-result searches | No | Result counts are not captured |
| Search filters usage | Partial | Frontend GA event sends filter keys; NR browser has param attributes |
| Opportunity view counts | No dedicated tracking | Only derivable from NR APM transaction counts |
| Save opportunity rates | No | No custom events for save/unsave actions |
| Saved search usage | No | No custom events for saved search CRUD operations |
| Search-to-view conversion | No | No funnel tracking exists |
| OpenSearch performance metrics | Partial | Available as external service calls in NR APM, but not dashboarded |

### Existing Data Sources That Could Power Metrics

| Source | What It Contains | Accessibility |
|--------|-----------------|---------------|
| NR APM Transactions | Per-endpoint throughput, latency, errors | NRQL queries |
| NR Browser | Page views, search param custom attributes | NRQL queries |
| NR Logs (via FluentBit) | Structured application logs with request IDs | NRQL queries on Log type |
| Google Analytics | `search_attempt` and `search_term` events | GA Dashboard |
| API Database | Saved opportunities, saved searches tables | Direct SQL or Metabase |
| OpenSearch | Search index data, query logs | OpenSearch Dashboards (if enabled) |

### External Reference

An API Metrics Google Sheet exists: [API Metrics by Sprint](https://docs.google.com/spreadsheets/d/19dftxSepvjVz_sil-eEL92FTMApRWJJ7Pq74JQh96Kg/edit#gid=1208306053) (referenced in `documentation/wiki/product/simpler-grants.gov-analytics/api-metrics.md`). This should be reviewed for any Find-related metrics it may contain.

---

## 5. Existing Metabase Dashboards

Metabase was selected as the BI tool per [ADR 2024-04-10](../../wiki/product/decisions/adr/2024-04-10-dashboard-tool.md), with Postgres as the analytics data store per [ADR 2024-03-19](../../wiki/product/decisions/adr/2024-03-19-dashboard-storage.md).

---

## 6. Gaps Identified

### Critical Gaps

1. **No custom business events emitted from the API** — `record_custom_event` helper is built but unused. Zero backend custom events flow to NR. All existing search analytics rely on frontend-only instrumentation (NR Browser + GA).
2. **No zero-result search tracking** — Zero-result searches are invisible. There is no way to identify queries that produce no results.
3. **No search-to-view-to-save funnel** — While the User/Usage Metrics dashboard tracks search CTR, there is no connected funnel showing: search → click result → view opportunity → save opportunity → apply.
4. **No dashboards-as-code** — All 8 NR dashboards are manually created in the UI with no version control. Changes cannot be code-reviewed and are at risk of being accidentally modified or deleted.

### Moderate Gaps

5. **No Metabase dashboards for Find** — All 88 Metabase queries are delivery/sprint/ETL focused. No queries exist for saved opportunities, saved searches, or search pattern analysis from the database.
6. **Search logging underutilized** — The search service emits only one log (index alias name). No query details, filter types, result counts, or response times are logged as structured attributes.
7. **Frontend analytics split across two systems** — Search data is split between NR Browser (custom attributes) and Google Analytics (`search_attempt`, `search_term` events), making holistic analysis difficult.

### Existing Coverage

8. **Search Parameters dashboard exists** — Tracks top search terms and recent queries across environments.
9. **User/Usage Metrics dashboard exists** — Provides search CTR (37.3%), filter usage breakdown, device distribution, search bar usage (211k), and top keywords.
10. **API Dashboard covers all Find endpoints** — Dedicated tabs for opportunity and user endpoints with throughput, success rates, and error patterns.
11. **Browser Overview confirms Find dominance** — `/opportunity/*` (92.5k) and `/search` (72.5k) are the #1 and #2 highest-traffic page groups.

---

## 7. Recommendations

### 7.1 Dashboard Improvements

#### Enhance Existing Find Dashboards
The existing Search Parameters and User/Usage Metrics dashboards should be augmented with:
- **Zero-result search rate** (requires #7.2 below)
- **Search latency percentiles** (p50, p95, p99) from APM data
- **OpenSearch external service call performance** from APM data
- **Save/unsave rates** per opportunity (requires #7.2 below)

**NRQL example for search latency percentiles:**
```sql
SELECT percentile(duration, 50, 95, 99) FROM Transaction
WHERE name LIKE '%opportunity_search%' TIMESERIES AUTO
```

#### Dashboards-as-Code
Export the existing 8 NR dashboards and manage them via the [New Relic Terraform provider](https://registry.terraform.io/providers/newrelic/newrelic/latest/docs) in the `infra/` directory. This would:
- Prevent accidental dashboard drift
- Enable code review for dashboard changes
- Make dashboards reproducible across accounts



### 7.2 Business Metrics Collection

#### Activate `record_custom_event` for Find Events

The existing `record_custom_event` helper in `api/src/adapters/newrelic/events.py` should be used to emit events for:

| Event Type | Trigger | Attributes to Capture |
|------------|---------|----------------------|
| `SearchOpportunity` | Search endpoint response | query (hashed), filters used, result_count, page_offset, response_time_ms, scoring_rule |
| `ViewOpportunity` | Opportunity GET response | opportunity_id, opportunity_status, agency_code |
| `SaveOpportunity` | Save opportunity POST | opportunity_id, user_id (hashed) |
| `UnsaveOpportunity` | Delete saved opportunity | opportunity_id |
| `SaveSearch` | Save search POST | filter_summary, result_count |
| `DeleteSavedSearch` | Delete saved search | saved_search_id |
| `ZeroResultSearch` | Search with 0 results | query (hashed), filters_used |

#### Enhance Structured Logging
Add structured log attributes to Find service functions following the existing [logging conventions](./logging-conventions.md):
- Log search result counts, filter types used, and pagination info
- Log opportunity view with opportunity metadata
- Log saved item operations with entity identifiers

---

## 8. Next Steps

### Existing Companion Tickets

1. **[#8231 — Define Find Funnel Metrics and User Events](https://github.com/HHS/simpler-grants-gov/issues/8231)** — Use the gaps from Section 6 to define exactly which events to track. The event table in Section 7.2 is a starting point.
2. **[#8247 — Event Instrumentation](https://github.com/HHS/simpler-grants-gov/issues/8247)** — Wire up `record_custom_event` calls for the event types listed in Section 7.2.

### Recommended New Tickets

3. **Activate `record_custom_event` for Find Endpoints** (~3 points) — Add calls to the existing helper in the search, opportunity view, save/unsave, and saved search handlers. Purely backend work that directly unblocks better dashboard data.
4. **Enhance Search Structured Logging** (~2 points) — Add result count, filter types, pagination info, and response time as `extra={}` kwargs in `search_opportunities.py`. Low risk since FluentBit already forwards everything to NR Logs.
5. **Add Zero-Result Search Tracking** (~1 point) — Emit a `ZeroResultSearch` custom event when result count is 0. The single most valuable missing metric for search quality.
6. **Dashboards-as-Code: Export NR Dashboards to Terraform** (~3 points) — Export all 8 dashboards via the NR API and manage them in `infra/` using the Terraform provider.
