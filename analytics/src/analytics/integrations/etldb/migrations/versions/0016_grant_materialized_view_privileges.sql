-- GRANT ... ON ALL TABLES IN SCHEMA and ALTER DEFAULT PRIVILEGES ... ON TABLES
-- (used elsewhere for these roles) do not cover materialized views in
-- Postgres. Each materialized view needs its own explicit grant.
--
-- metabaseuser only exists in environments where Metabase's infra has
-- provisioned it (not local/CI), so each grant is conditional on the role
-- actually existing.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app') THEN
    EXECUTE 'GRANT SELECT ON mv_deliverables_per_quad TO app';
    EXECUTE 'GRANT SELECT ON mv_latest_epic_deliverable_map TO app';
    EXECUTE 'GRANT SELECT ON mv_deliverable_daily_burndown TO app';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'metabaseuser') THEN
    EXECUTE 'GRANT SELECT ON mv_deliverables_per_quad TO metabaseuser';
    EXECUTE 'GRANT SELECT ON mv_latest_epic_deliverable_map TO metabaseuser';
    EXECUTE 'GRANT SELECT ON mv_deliverable_daily_burndown TO metabaseuser';
  END IF;
END
$$;
