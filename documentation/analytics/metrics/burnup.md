# Burnup

Burnup shows the total number of open issues or points per day over a given date range. burnup charts are often used to answer the following questions:

- *Have we planned work correctly?* For example, if a burnup chart shows several issues or points open by the end of a sprint, it could signal the need to re-examine how we're planning our sprint capacity.
- *Have we broken work into manageable chunks?* For example, if we see a long plateau where the number of closed issues remain steady, then suddenly increases, it could be a signal that the amount of work scoped into one ticket is too large.
- *Are we encountering blockers?* Alternatively, a long plateau could also be a signal of external factors that are blocking forward progress.

> [!NOTE]
> While burnup can provide helpful signals in the cases above, these signals tell only part of the story. burnup charts should prompt questions, not represent definitive conclusions.

## Methodology

### Summary

In order to calculate burnup there are a few key steps:

1. Isolate the set of issues assigned to the sprint (or deliverable) for which we're calculating burnup.
2. Get the number of issues (or points) opened and closed per day over the date range we care about.
3. Get the total number of open issues (or points) and the cumulative sum of issues closed per day over the date range we care about. 

> [!NOTE]
> If an issue is unpointed, it *does* count toward burnup by issues, but *does not* count toward burnup by points.

### Step-by-step example: Sprint burnup

<details>
<summary>Sample input</summary>

| sprint   | issue_title | story_points | opened_date | closed_date | sprint_start | sprint_end |
| -------- | ----------- | ------------ | ----------- | ----------- | ------------ | ---------- |
| Sprint 1 | Issue 1     | 2            | 2023-10-30  | 2023-11-02  | 2023-11-01   | 2023-11-05 |
| Sprint 1 | Issue 2     | 1            | 2023-11-01  | None        | 2023-11-01   | 2023-11-05 |
| Sprint 1 | Issue 3     | None         | 2023-11-01  | 2023-11-04  | 2023-11-01   | 2023-11-05 |
| Sprint 1 | Issue 4     | 3            | 2023-11-01  | 2023-11-05  | 2023-11-01   | 2023-11-05 |
| Sprint 2 | Issue 5     | 3            | 2023-11-02  | 2023-11-07  | 2023-11-06   | 2023-11-10 |
| Sprint 1 | Issue 6     | 2            | 2023-11-02  | 2023-11-04  | 2023-11-01   | 2023-11-05 |
| Sprint 2 | Issue 7     | 1            | 2023-11-03  | None        | 2023-11-06   | 2023-11-10 |

</details>

<details>
<summary>Step 1: Isolate sprint records</summary>

| sprint   | issue_title | story_points | opened_date | closed_date | sprint_start | sprint_end |
| -------- | ----------- | ------------ | ----------- | ----------- | ------------ | ---------- |
| Sprint 1 | Issue 1     | 2            | 2023-10-30  | 2023-11-02  | 2023-11-01   | 2023-11-05 |
| Sprint 1 | Issue 2     | 1            | 2023-11-01  | None        | 2023-11-01   | 2023-11-05 |
| Sprint 1 | Issue 3     | None         | 2023-11-01  | 2023-11-04  | 2023-11-01   | 2023-11-05 |
| Sprint 1 | Issue 4     | 3            | 2023-11-01  | 2023-11-05  | 2023-11-01   | 2023-11-05 |
| Sprint 1 | Issue 6     | 2            | 2023-11-02  | 2023-11-04  | 2023-11-01   | 2023-11-05 |

</details>

<details>
<summary>Step 2: Create date range for burnup</summary>

Create a date range that runs from the earliest date a ticket was opened to the latest date a ticket was closed *or* to the end of the sprint, whichever is later.

| date       |
| ---------- |
| 2023-10-30 |
| 2023-10-31 |
| 2023-11-01 |
| 2023-11-02 |
| 2023-11-03 |
| 2023-11-04 |
| 2023-11-05 |

</details>

<details>
<summary>Step 3: Group issues/points by date opened</summary>

By points:

| date       | opened |
| ---------- | ------ |
| 2023-10-30 | 2      |
| 2023-11-01 | 4      |
| 2023-11-02 | 2      |

By issues:

| date       | opened |
| ---------- | ------ |
| 2023-10-30 | 1      |
| 2023-11-01 | 3      |
| 2023-11-02 | 1      |

</details>

<details>
<summary>Step 4: Group issues/points by date closed</summary>

By points:

| date       | closed |
| ---------- | ------ |
| 2023-11-02 | 2      |
| 2023-11-04 | 2      |
| 2023-11-05 | 3      |

By issues:

| date       | closed |
| ---------- | ------ |
| 2023-11-02 | 1      |
| 2023-11-04 | 2      |
| 2023-11-05 | 1      |

</details>

<details>
<summary>Step 5: Join on date and calculate the total sums of open and cumulative sum of closed issues</summary>

By points:

| date       | opened | closed | total_opened|total_closed|
| ---------- | ------ | ------ | ----------- |------------|
| 2023-10-30 | 2      | 0      | 2           | 0          |
| 2023-10-31 | 0      | 0      | 2           | 0          |
| 2023-11-01 | 4      | 0      | 6           | 0          |
| 2023-11-02 | 2      | 2      | 8           | 2          |
| 2023-11-03 | 0      | 0      | 8           | 2          |
| 2023-11-04 | 0      | 2      | 8           | 4          |
| 2023-11-05 | 0      | 3      | 8           | 7          |

By issues:

| date       | opened | closed | total_open |total_closed|
| ---------- | ------ | ------ | ---------- |------------|
| 2023-10-30 | 1      | 0      | 1          | 0          |
| 2023-10-31 | 0      | 0      | 1          | 0          |
| 2023-11-01 | 3      | 0      | 4          | 0          |
| 2023-11-02 | 1      | 1      | 4          | 1          |
| 2023-11-03 | 0      | 0      | 4          | 1          |
| 2023-11-04 | 0      | 2      | 4          | 3          |
| 2023-11-05 | 0      | 1      | 4          | 4          |


