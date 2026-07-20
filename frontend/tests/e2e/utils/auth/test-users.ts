import playwrightEnv from "tests/e2e/playwright-env";

/*
  Central map of E2E test users, keyed by a readable identifier and resolving to
  the static user id for the active target environment. Tests pass a TestUserKey
  to authenticateE2eUser to choose which seeded user to log in as.

  Each seeded user is flagged in the API seed (with_e2e_test_user grants the
  READ_TEST_USER_TOKEN privilege) so its session token can be fetched via
  POST /v1/internal/e2e-token. To add a test user: seed it with a static id in
  api/tests/lib/seed_e2e.py, then add a matching entry here.
*/

export type TestUserKey = "primaryOrgAdmin" | "orgMember";

// Local ids match api/tests/lib/seed_e2e.py + api/tests/lib/seed_orgs_and_users.py.
const LOCAL_TEST_USER_IDS: Record<TestUserKey, string> = {
  // one_org_user: ORG_ADMIN of "Sally's Soup Emporium" plus grantor
  // (OPPORTUNITY_PUBLISHER) on the E2E agency. Default user for apply-flow,
  // opportunity-creation, and saved-opportunity tests.
  primaryOrgAdmin: "f15c7491-7ebc-4f4f-8de6-3ac0594d9c63",
  // ORG_MEMBER (not admin) of "E2E Test Organization": has VIEW_ORG_MEMBERSHIP
  // but NOT MANAGE_ORG_MEMBERS. Used to assert a non-default (org-member) user
  // can log in and view their organization's detail page.
  orgMember: "a7b8c9d0-e1f2-4a3b-8c4d-5e6f7a8b9c0d",
};

// Staging ids reference users provisioned directly in staging (not by the repo
// seed). The ids themselves are not secret and are committed here; they are also
// recorded in the QA handoff doc / 1Password. (The manager API key is the secret
// and stays in env config.)
const STAGING_TEST_USER_IDS: Record<TestUserKey, string> = {
  // Existing primary staging test user (was STAGING_TEST_USER_ID).
  primaryOrgAdmin: "c850d239-43bb-4ccd-9746-977ac7978b79",
  // Member of "E2E Test Organization" (see STAGING_TEST_ORG_IDS.e2eTestOrg).
  orgMember: "ba856cd5-e047-436e-9b6b-f53b4cc534cc",
};

// Organization ids used to build org-scoped URLs (e.g. the org detail page).
export type TestOrgKey = "e2eTestOrg";

const LOCAL_TEST_ORG_IDS: Record<TestOrgKey, string> = {
  // "E2E Test Organization" — orgMember above is a member of this org.
  e2eTestOrg: "e5f6a7b8-c9d0-4e5f-8a0b-1c2d3e4f5061",
};

// "E2E Test Organization" — the staging orgMember is a member (not admin) here.
// The POC navigates to this org's detail page to confirm the org-member user
// can view it.
const STAGING_TEST_ORG_IDS: Record<TestOrgKey, string> = {
  e2eTestOrg: "9c6fcfb9-029d-4b69-af43-3b41257639f5",
};

const isStaging = playwrightEnv.targetEnv === "staging";

export const TEST_USER_IDS = isStaging
  ? STAGING_TEST_USER_IDS
  : LOCAL_TEST_USER_IDS;

export const TEST_ORG_IDS = isStaging
  ? STAGING_TEST_ORG_IDS
  : LOCAL_TEST_ORG_IDS;

export const getTestUserId = (key: TestUserKey): string => TEST_USER_IDS[key];
