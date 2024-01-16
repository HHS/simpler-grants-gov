# Percent complete by deliverable

Percent complete shows the percentage of all issues or points assigned to a given deliverable that have been completed. Percent complete charts are often used to answer the following questions:

- *How much work does this deliverable entail?* Part of the reason we display both the percentage and the total number of open/closed tickets is that some deliverables are larger in scope than others. This metric helps us compare both scope of work and progress per deliverable.
- *How close are we to completing this deliverable?* Often, senior leadership wants to understand our progress toward key deliverables within the project.
- *Will we be able to hit our target date?* For example, if we are only a few days or weeks out from our target deliverable but are only at 80% completion, it may be a signal that we should cut scope or revise our target.

## Methodology

### Sample input

| deliverable | issue_title | status | story_points |
| ----------- | ----------- | ------ | ------------ |
| Site launch | Issue 1     | open   | 1            |
| Site launch | Issue 2     | closed | 3            |
| Site launch | Issue 3     | closed | 2            |
| Site launch | Issue 4     | open   | 2            |
| API launch  | Issue 5     | closed | 2            |
| API launch  | Issue 6     | closed | 1            |
| API launch  | Issue 7     | open   | 2            |
| API launch  | Issue 8     | closed | 1            |

### Step 1: Count the total number of issues/points deliverable

By points:

| deliverable | total |
| ----------- | ----- |
| Site launch | 8     |
| API launch  | 6     |

By issues:

| deliverable | total |
| ----------- | ----- |
| Site launch | 4     |
| API launch  | 4     |

### Step 2: Count the number of *closed* issues/points deliverable

By points:

| deliverable | closed |
| ----------- | ------ |
| Site launch | 5      |
| API launch  | 4      |

By issues:

| deliverable | closed |
| ----------- | ------ |
| Site launch | 2      |
| API launch  | 3      |


### Step 3: Join on deliverable and calculate issues/points open

By points:

| deliverable | total | closed | open |
| ----------- | ----- | ------ | ---- |
| Site launch | 8     | 5      | 3    |
| API launch  | 6     | 4      | 2    |

By issues:

| deliverable | total | closed | open |
| ----------- | ----- | ------ | ---- |
| Site launch | 4     | 2      | 2    |
| API launch  | 4     | 3      | 1    |

### Step 3: Calculate percent complete

> [!NOTE]
> While we leave the full decimal in the results dataframe, when we visualize the results, we round to the nearest percentage point and display as a percentage rather than as a decimal.

By points:

| deliverable | total | closed | open | percent_complete |
| ----------- | ----- | ------ | ---- | ---------------- |
| Site launch | 8     | 5      | 3    | 0.625            |
| API launch  | 6     | 4      | 2    | 0.6666666667     |

By issues:

| deliverable | total | closed | open | percent_complete |
| ----------- | ----- | ------ | ---- | ---------------- |
| Site launch | 4     | 2      | 2    | 0.5              |
| API launch  | 4     | 3      | 1    | 0.75             |
