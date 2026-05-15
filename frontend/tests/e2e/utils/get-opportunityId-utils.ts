import {
  testdata_local_environment,
  testdata_staging_environment,
} from "tests/e2e/opportunity-id-data";
import playwrightEnv from "tests/e2e/playwright-env";

export function getOpportunityId() {
  const { targetEnv } = playwrightEnv;
  return targetEnv === "local"
    ? testdata_local_environment.opportunityID
    : testdata_staging_environment.opportunityID;
}
