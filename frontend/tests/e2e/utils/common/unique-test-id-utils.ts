/**
 * Generates identifiers for test-created data (application names, opportunity
 * titles, saved search names, etc.) that are unique enough to avoid being
 * confused with another concurrently-running test's data, and traceable
 * back to which worker/shard created them when triaging a failure.
 *
 * This is the complementary half of the primaryOrgAdmin pool in
 * sharded-test-user-utils.ts: that reduces how often two tests mutate the
 * exact same underlying account at the same time; this makes it safe even
 * when they do, by letting a test identify precisely the record *it*
 * created instead of relying on "the latest one" or a raw count.
 */

function getEnvTag(name: string): string {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : "0";
}

/**
 * Builds a short, greppable, sufficiently-unique id for test-created data.
 *
 * Format: `<prefix>-s<shard>w<worker>-<timestamp>-<random>`
 * - shard/worker come from CURRENT_SHARD / TEST_PARALLEL_INDEX, the same
 *   signals used for test-user pooling, so a record's name alone tells you
 *   which concurrent run produced it.
 * - timestamp + a short random suffix guard against two calls in the same
 *   worker landing in the same millisecond (rare, but free to rule out).
 *
 * @example buildUniqueTestId("TEST-APPLY-ORG-IND-APP")
 *   -> "TEST-APPLY-ORG-IND-APP-s2w3-1718000000000-a1b2c3"
 */
export function buildUniqueTestId(prefix: string): string {
  const shard = getEnvTag("CURRENT_SHARD");
  const worker = getEnvTag("TEST_PARALLEL_INDEX");
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `${prefix}-s${shard}w${worker}-${Date.now()}-${randomSuffix}`;
}
