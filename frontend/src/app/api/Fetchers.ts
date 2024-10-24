import SearchOpportunityAPI from "src/app/api/SearchOpportunityAPI";

import OpportunityListingAPI from "./OpportunityListingAPI";

const fetchers = {
  searchOpportunityFetcher: new SearchOpportunityAPI(),
  opportunityFetcher: new OpportunityListingAPI(),
};

export default fetchers;
