import {
  testdata_local_environment,
  testdata_staging_environment,
} from "./opportunity-id-data";
import playwrightEnv from "./playwright-env";

export function getOpportunityId() {
  const { targetEnv } = playwrightEnv;
  return targetEnv === "local"
    ? testdata_local_environment.opportunityID
    : testdata_staging_environment.opportunityID;
}
