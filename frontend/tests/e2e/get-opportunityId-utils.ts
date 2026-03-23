import playwrightEnv from "./playwright-env";
import { testdata_local_environment, testdata_staging_environment } from "./opportunity-id-data";

const { targetEnv } = playwrightEnv;

// Select opportunityID based on targetEnv
const opportunityId = targetEnv === "local"
	? testdata_local_environment.opportunityID
	: testdata_staging_environment.opportunityID;

export { opportunityId };

export function getOpportunityId() {
  const { targetEnv } = playwrightEnv;
  return targetEnv === "local"
    ? testdata_local_environment.opportunityID
    : testdata_staging_environment.opportunityID;
}
