-- GRANT ... ON ALL TABLES IN SCHEMA and ALTER DEFAULT PRIVILEGES ... ON TABLES
-- (used elsewhere for these roles) do not cover materialized views in
-- Postgres. Each materialized view needs its own explicit grant.
GRANT SELECT ON mv_deliverables_per_quad TO metabaseuser;
GRANT SELECT ON mv_latest_epic_deliverable_map TO metabaseuser;
GRANT SELECT ON mv_deliverable_daily_burndown TO metabaseuser;

GRANT SELECT ON mv_deliverables_per_quad TO app;
GRANT SELECT ON mv_latest_epic_deliverable_map TO app;
GRANT SELECT ON mv_deliverable_daily_burndown TO app;
