# Burndown

Burndown shows the total number of open issues or points per day over a given date range. Burndown charts are often used to answer the following questions:

- *Have we planned work correctly?* For example, if a burndown chart shows several issues or points open by the end of a sprint, it could signal the need to re-examine how we're planning our sprint capacity.
- *Have we broken work into manageable chunks?* For example, if we see a long plateau where the number of open points remain steady, then suddenly drop, it could be a signal that the amount of work scoped into one ticket is too large.
- *Are we encountering blockers?* Alternatively, a long plateau could also be a signal of external factors that are blocking forward progress.

> [!NOTE]
> While burndown can provide helpful signals in the cases above, these signals tell only part of the story. Burndown charts should prompt questions, not represent definitive conclusions.

## Methodology

### Summary

In order to calculate burndown there are a few key steps:

1. Isolate the set of issues assigned to the sprint (or deliverable) for which we're calculating burndown.
2. Get the number of issues (or points) opened and closed per day over the date range we care about.
3. Subtract the number closed from the number opened to get the delta, i.e. the total number of issues/points opened or closed each day.
4. Cumulatively sum the deltas over the date range to find the running total of open issues (or points) per day.

### Step-by-step example: Sprint burndown

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
<summary>Step 2: Create date range for burndown</summary>

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

> [!NOTE]
> If an issue is unpointed, it still counts toward total *issues* opened but not total points opened.

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
<summary>Step 5: Join on date and calculate the delta</summary>

By points:

| date       | opened | closed | delta |
| ---------- | ------ | ------ | ----- |
| 2023-10-30 | 2      | 0      | 2     |
| 2023-10-31 | 0      | 0      | 0     |
| 2023-11-01 | 4      | 0      | 4     |
| 2023-11-02 | 2      | 2      | 0     |
| 2023-11-03 | 0      | 0      | 0     |
| 2023-11-04 | 0      | 2      | -2    |
| 2023-11-05 | 0      | 3      | -3    |

By issues:

| date       | opened | closed | delta |
| ---------- | ------ | ------ | ----- |
| 2023-10-30 | 1      | 0      | 1     |
| 2023-10-31 | 0      | 0      | 0     |
| 2023-11-01 | 3      | 0      | 3     |
| 2023-11-02 | 1      | 1      | 0     |
| 2023-11-03 | 0      | 0      | 0     |
| 2023-11-04 | 0      | 2      | -2    |
| 2023-11-05 | 0      | 1      | -1    |

</details>

<details>
<summary>Step 6: Calculate the running total by cumulatively summing the deltas</summary>

By points:

| date       | opened | closed | delta | total_open |
| ---------- | ------ | ------ | ----- | ---------- |
| 2023-10-30 | 2      | 0      | 2     | 2          |
| 2023-10-31 | 0      | 0      | 0     | 2          |
| 2023-11-01 | 4      | 0      | 4     | 6          |
| 2023-11-02 | 2      | 2      | 0     | 6          |
| 2023-11-03 | 0      | 0      | 0     | 6          |
| 2023-11-04 | 0      | 2      | -2    | 4          |
| 2023-11-05 | 0      | 3      | -3    | 1          |

By issues:

| date       | opened | closed | delta | total_open |
| ---------- | ------ | ------ | ----- | ---------- |
| 2023-10-30 | 1      | 0      | 1     | 1          |
| 2023-10-31 | 0      | 0      | 0     | 1          |
| 2023-11-01 | 3      | 0      | 3     | 4          |
| 2023-11-02 | 1      | 1      | 0     | 4          |
| 2023-11-03 | 0      | 0      | 0     | 4          |
| 2023-11-04 | 0      | 2      | -2    | 2          |
| 2023-11-05 | 0      | 1      | -1    | 1          |

</details>
