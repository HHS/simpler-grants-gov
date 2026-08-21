-- app already has SELECT on these materialized views via the
-- ALTER DEFAULT PRIVILEGES set up in migration 0001, scoped to objects
-- migrator creates. metabaseuser's existing access to this schema instead
-- traces back to a one-time GRANT ON ALL TABLES IN SCHEMA, run against
-- whatever tables existed at the time -- there's no standing default-acl
-- rule covering objects migrator creates, so nothing keeps metabaseuser's
-- grants in sync going forward. Every migration that adds a new relation
-- needs its own explicit grant here until that's fixed at the infra level.
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
