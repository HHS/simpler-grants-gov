/**
 * Isolates the heavily-shared "primaryOrgAdmin" test identity across
 * concurrently-running tests, so two tests that both create/mutate
 * applications or opportunities as "the org admin" don't collide.
 *
 * Two distinct concurrency sources exist today and need two different
 * signals to tell them apart:
 *
 *  - Ordinary CI/local runs (ci-frontend-e2e.yml): a single run with
 *    PLAYWRIGHT_WORKERS=10 (the default) against one seeded database.
 *    Playwright sets TEST_PARALLEL_INDEX (0-based, bounded by the worker
 *    count) uniquely per concurrently-running worker *within* that run.
 *  - Staging (e2e-staging.yml): 6 separate Chrome shards run as
 *    concurrent CI jobs against the same shared staging environment, each
 *    with PLAYWRIGHT_WORKERS=1. TEST_PARALLEL_INDEX is always 0 there
 *    (only one worker per job), so it can't differentiate the 6 shards -
 *    CURRENT_SHARD (set in playwright-env.ts from the shard matrix) is
 *    what actually separates them.
 *
 * Combining both covers each scenario without the other signal getting in
 * the way (shardIndex is always 0 for untested/local/non-sharded runs;
 * parallelIndex is always 0 for staging's single-worker shards).
 *
 * IMPORTANT - this only removes collisions up to the size of the pool
 * below. The local pool (10) matches the default worker count, so local/CI
 * runs get one user per worker. It does not guarantee zero collisions if
 * the worker count is raised above the pool size, and staging's pool is
 * still 1. Full elimination requires growing the pools to match real
 * worst-case concurrency or moving to ephemeral per-test users (see the
 * test-user-manager API already used for session spoofing) - a larger,
 * separate change.
 */

import playwrightEnv, { type SupportedEnvs } from "tests/e2e/playwright-env";
import { getTestUserId } from "tests/e2e/utils/auth/test-users";

// Additional seeded identities that are equivalent to "primaryOrgAdmin"
// (same org, same agency, same roles) for environments that have them.
// Index 0 is intentionally the existing primaryOrgAdmin id from
// test-users.ts, so a pool of length 1 (the default today, before any
// additional users are seeded/provisioned) falls back to exactly today's
// behavior.
//
// local: extend by adding matching UserBuilder(...) blocks to
//   api/tests/lib/seed_e2e.py (mirror the primaryOrgAdmin block - same
//   org/agency/roles, new static UUIDs) and listing the new ids here.
// staging: these must be provisioned directly in staging by whoever
//   manages staging test data (see the QA handoff doc / 1Password note in
//   test-users.ts) - this is NOT something a code change alone can do.
//   Until additional staging ids exist, the staging pool stays length 1
//   and every shard continues sharing the one staging primaryOrgAdmin,
//   same as today.
const PRIMARY_ORG_ADMIN_POOL_IDS: Partial<Record<SupportedEnvs, string[]>> = {
  // Matches E2E_PRIMARY_ORG_ADMIN_POOL_USER_IDS in api/tests/lib/seed_e2e.py.
  // Covers up to 10 concurrently-running local/CI workers without collision,
  // matching the PLAYWRIGHT_WORKERS default of 10 in ci-frontend-e2e.yml.
  // If the worker count is raised, add more ids here and in seed_e2e.py.
  local: [
    getTestUserId("primaryOrgAdmin"),
    "f25c7491-7ebc-4f4f-8de6-3ac0594d9c64",
    "f35c7491-7ebc-4f4f-8de6-3ac0594d9c65",
    "f45c7491-7ebc-4f4f-8de6-3ac0594d9c66",
    "f55c7491-7ebc-4f4f-8de6-3ac0594d9c67",
    "f65c7491-7ebc-4f4f-8de6-3ac0594d9c68",
    "f75c7491-7ebc-4f4f-8de6-3ac0594d9c69",
    "f85c7491-7ebc-4f4f-8de6-3ac0594d9c6a",
    "f95c7491-7ebc-4f4f-8de6-3ac0594d9c6b",
    "fa5c7491-7ebc-4f4f-8de6-3ac0594d9c6c",
  ],
  // TODO: once additional staging test users are provisioned, list their
  // ids here (in shard order doesn't matter - the mapping is by index
  // modulo pool length). Leave as a single-entry pool until then - this is
  // a manual provisioning step, not something this code change can do.
  staging: [getTestUserId("primaryOrgAdmin")],
  grantee1: [getTestUserId("primaryOrgAdmin")],
  grantee2: [getTestUserId("primaryOrgAdmin")],
  grantor1: [getTestUserId("primaryOrgAdmin")],
  grantor2: [getTestUserId("primaryOrgAdmin")],
};

function parseNonNegativeInt(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

/**
 * 0-based shard offset. CURRENT_SHARD (set by e2e-staging.yml's matrix) is
 * 1-based when present; unset (local/ordinary CI) is treated as shard 0.
 */
function getShardIndex(): number {
  const current = parseNonNegativeInt(playwrightEnv.currentShard);
  return current > 0 ? current - 1 : 0;
}

/**
 * 0-based index of the currently-running worker among the workers active
 * in this run. 0 when unset (e.g. workers=1, or outside a Playwright
 * worker process).
 */
function getParallelIndex(): number {
  return parseNonNegativeInt(process.env.TEST_PARALLEL_INDEX);
}

/**
 * Returns the seeded user id to use for "primaryOrgAdmin" in the current
 * worker/shard, picking a different pooled identity per concurrently
 * running worker and per concurrently running staging shard where a pool
 * exists, and falling back to the single existing primaryOrgAdmin id
 * everywhere a pool hasn't been provisioned yet.
 */
export function getShardedPrimaryOrgAdminId(): string {
  const envKey = playwrightEnv.targetEnv as SupportedEnvs;
  const pool = PRIMARY_ORG_ADMIN_POOL_IDS[envKey];
  const fallback = getTestUserId("primaryOrgAdmin");

  if (!pool || pool.length === 0) {
    return fallback;
  }

  const poolIndex = (getShardIndex() + getParallelIndex()) % pool.length;
  return pool[poolIndex] ?? fallback;
}
