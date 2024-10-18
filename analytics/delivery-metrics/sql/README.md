# Delivery Metrics

## DB Schema
The schema is defined in [create_delivery_metrics_db.sql](./create_delivery_metrics_db.sql) 

## SCD Update Pattern
Slowly changing data that are pertinent to as-is and as-was delivery metrics calculations are stored in the following tables:
* `deliverable_quad_map`
* `epic_deliverable_map`
* `issue_history`
* `issue_sprint_map`

The tables utilize a datestamp column (`d_effective`) to record the effective date of each state as state snapshots are captured over time.

## Entity Relationship Diagram
The logical model is described in [schema-ERD.png](./schema-ERD.png)

![entity relationship diagram](./schema-ERD.png)

