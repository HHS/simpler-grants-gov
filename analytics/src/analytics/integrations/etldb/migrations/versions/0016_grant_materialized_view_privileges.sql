-- app already has SELECT on these materialized views via the
-- ALTER DEFAULT PRIVILEGES set up in migration 0001. metabaseuser's
-- Postgres role isn't provisioned by this repo's infra/modules/database
-- role-manager pipeline (unlike app/migrator), so nothing in this codebase
-- keeps its grants in sync with schema changes -- it needs an explicit
-- grant here.
--
-- metabaseuser only exists in environments where Metabase's infra has
-- provisioned it (not local/CI), so the grant is conditional on the role
-- actually existing.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'metabaseuser') THEN
    EXECUTE 'GRANT SELECT ON mv_deliverables_per_quad TO metabaseuser';
    EXECUTE 'GRANT SELECT ON mv_latest_epic_deliverable_map TO metabaseuser';
    EXECUTE 'GRANT SELECT ON mv_deliverable_daily_burndown TO metabaseuser';
  END IF;
END
$$;
