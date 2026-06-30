# Contributor tracking table (SOP Appendix A)

The tracking table lives in the **description of every bounty issue**. The Open
Source Associate maintains it manually during Phase 1. Each `/claim` appends a new
row; every later state change updates that same row.

## Drop-in (empty) — for a freshly posted issue

```markdown
| Contributor | ToS Ack | Status | Last Updated | PR | Notes |
| ----------- | ------- | ------ | ------------ | -- | ----- |
| _no claims yet_ | | | | | |
```

## Example — with active rows

```markdown
| Contributor | ToS Ack | Status | Last Updated | PR | Notes |
| ----------- | ------- | ------ | ------------ | --- | ----- |
| @alice | Ack 2026-04-10 | in review | 2026-04-20 | #123 | — |
| @bob | Ack 2026-04-12 | stale | 2026-04-14 | — | No activity 7d |
| @carol | Ack 2026-04-18 | in progress | 2026-04-19 | — | — |
```

## Status values

| Status | Meaning |
| --- | --- |
| `claimed` | `/claim` accepted; no work started yet. |
| `in progress` | Contributor has committed work or posted substantive progress. |
| `pr submitted` | PR opened; CI not yet complete or reviews not started. |
| `in review` | PR has at least one maintainer review in progress. |
| `paid` | Bounty has been paid to this contributor. |
| `stale` | No activity for 14 days. |
| `withdrawn` | Contributor commented `/withdraw`. |
| `declined` | Valid-but-unselected (runner-up), or declined for eligibility, compliance, or scope. |

## Rules

- **One row per `/claim`.** Never delete or re-use a row — always append.
- Rows are ordered by claim date, oldest first.
- The **issue-level status label** reflects the most advanced active state across
  all rows.
- Once a row is set to `paid`, all other open rows move to `declined` with a date
  stamp.
- Once the issue transitions to `status:paid`, swap the bounty banner for the
  [paid banner](./paid-banner.md) and close the issue.