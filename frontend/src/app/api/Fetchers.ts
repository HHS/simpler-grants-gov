import OpportunityListingAPI from "src/app/api//OpportunityListingAPI";
import SearchOpportunityAPI from "src/app/api/SearchOpportunityAPI";

const fetchers = {
  searchOpportunityFetcher: new SearchOpportunityAPI(),
  opportunityFetcher: new OpportunityListingAPI(),
};

export default fetchers;
