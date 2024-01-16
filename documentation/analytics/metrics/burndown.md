# Burndown

Burndown shows the total number of open issues or points per day over a given date range. Burndown charts are often used to answer the following questions:

- *Have we planned work correctly?* For example, if a burndown chart shows several issues or points open by the end of a sprint, it could be a signal to re-examine how we're planning our sprints.
- *Have we broken work into manageable chunks?* For example, if we see a long plateau where the number of open points remain steady, then suddenly drop, it could be a signal that the amount of work scoped into one ticket is too large.
- *Are we encountering blockers?* Alternatively, a long plateau could also be a signal of external factors that are blocking forward progress.

> [!NOTE]
> While burndown can provide helpful signals in the cases above, these signals tell only part of the story. Burndown charts should prompt questions, not represent specific conclusions.

## Methodology

### Sample input

| sprint   | issue_title | story_points | opened_date | closed_date | sprint_start | sprint_end |
| -------- | ----------- | ------------ | ----------- | ----------- | ------------ | ---------- |
| Sprint 1 | Issue 1     | 2            | 2023-10-30  | 2023-11-02  | 2023-11-01   | 2023-11-05 |
| Sprint 1 | Issue 2     | 1            | 2023-11-01  | None        | 2023-11-01   | 2023-11-05 |
| Sprint 1 | Issue 3     | None         | 2023-11-01  | 2023-11-04  | 2023-11-01   | 2023-11-05 |
| Sprint 1 | Issue 4     | 3            | 2023-11-01  | 2023-11-05  | 2023-11-01   | 2023-11-05 |
| Sprint 2 | Issue 5     | 3            | 2023-11-02  | 2023-11-07  | 2023-11-06   | 2023-11-10 |
| Sprint 1 | Issue 6     | 2            | 2023-11-02  | 2023-11-04  | 2023-11-01   | 2023-11-05 |
| Sprint 2 | Issue 7     | 1            | 2023-11-03  | None        | 2023-11-06   | 2023-11-10 |

### Step 1: Isolate sprint records

| sprint   | issue_title | story_points | opened_date | closed_date | sprint_start | sprint_end |
| -------- | ----------- | ------------ | ----------- | ----------- | ------------ | ---------- |
| Sprint 1 | Issue 1     | 2            | 2023-10-30  | 2023-11-02  | 2023-11-01   | 2023-11-05 |
| Sprint 1 | Issue 2     | 1            | 2023-11-01  | None        | 2023-11-01   | 2023-11-05 |
| Sprint 1 | Issue 3     | None         | 2023-11-01  | 2023-11-04  | 2023-11-01   | 2023-11-05 |
| Sprint 1 | Issue 4     | 3            | 2023-11-01  | 2023-11-05  | 2023-11-01   | 2023-11-05 |
| Sprint 1 | Issue 6     | 2            | 2023-11-02  | 2023-11-04  | 2023-11-01   | 2023-11-05 |

### Step 2: Create date range for burndown

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

### Step 3: Group issues/points by date opened

> [!NOTE]
> If an issue is unpointed, it still counts toward total *issues* opened but not total points opened.

For burndown by points:

| date       | opened |
| ---------- | ------ |
| 2023-10-30 | 2      |
| 2023-11-01 | 4      |
| 2023-11-02 | 2      |

For burndown by issues:

| date       | opened |
| ---------- | ------ |
| 2023-10-30 | 1      |
| 2023-11-01 | 3      |
| 2023-11-02 | 1      |

### Step 4: Group issues/points by date closed

For burndown by points:

| date       | closed |
| ---------- | ------ |
| 2023-11-02 | 2      |
| 2023-11-04 | 2      |
| 2023-11-05 | 3      |

For burndown by issues:

| date       | closed |
| ---------- | ------ |
| 2023-11-02 | 1      |
| 2023-11-04 | 2      |
| 2023-11-05 | 1      |

### Step 5: Join on date and calculate the delta

For burndown by points:

| date       | opened | closed | delta |
| ---------- | ------ | ------ | ----- |
| 2023-10-30 | 2      | 0      | 2     |
| 2023-10-31 | 0      | 0      | 0     |
| 2023-11-01 | 4      | 0      | 4     |
| 2023-11-02 | 2      | 2      | 0     |
| 2023-11-03 | 0      | 0      | 0     |
| 2023-11-04 | 0      | 2      | -2    |
| 2023-11-05 | 0      | 3      | -3    |

For burndown by issues:

| date       | opened | closed | delta |
| ---------- | ------ | ------ | ----- |
| 2023-10-30 | 1      | 0      | 1     |
| 2023-10-31 | 0      | 0      | 0     |
| 2023-11-01 | 3      | 0      | 3     |
| 2023-11-02 | 1      | 1      | 0     |
| 2023-11-03 | 0      | 0      | 0     |
| 2023-11-04 | 0      | 2      | -2    |
| 2023-11-05 | 0      | 1      | -1    |

### Step 6: Calculate the running total by cumulatively summing the deltas

For burndown by points:

| date       | opened | closed | delta | total_open |
| ---------- | ------ | ------ | ----- | ---------- |
| 2023-10-30 | 2      | 0      | 2     | 2          |
| 2023-10-31 | 0      | 0      | 0     | 2          |
| 2023-11-01 | 4      | 0      | 4     | 6          |
| 2023-11-02 | 2      | 2      | 0     | 6          |
| 2023-11-03 | 0      | 0      | 0     | 6          |
| 2023-11-04 | 0      | 2      | -2    | 4          |
| 2023-11-05 | 0      | 3      | -3    | 1          |

For burndown by points:

| date       | opened | closed | delta | total_open |
| ---------- | ------ | ------ | ----- | ---------- |
| 2023-10-30 | 1      | 0      | 1     | 1          |
| 2023-10-31 | 0      | 0      | 0     | 1          |
| 2023-11-01 | 3      | 0      | 3     | 4          |
| 2023-11-02 | 1      | 1      | 0     | 4          |
| 2023-11-03 | 0      | 0      | 0     | 4          |
| 2023-11-04 | 0      | 2      | -2    | 2          |
| 2023-11-05 | 0      | 1      | -1    | 1          |
