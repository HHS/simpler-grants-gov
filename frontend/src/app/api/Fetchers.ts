import OpportunityListingAPI from "src/app/api//OpportunityListingAPI";
import SearchOpportunityAPI from "src/app/api/SearchOpportunityAPI";

import { cache } from "react";

const searchApi = new SearchOpportunityAPI();
const opportunityListingApi = new OpportunityListingAPI();

const fetchers = {
  searchOpportunityFetcher: searchApi.searchOpportunities.bind(searchApi),
  opportunityFetcher: cache(
    opportunityListingApi.getOpportunityById.bind(opportunityListingApi),
  ),
};

export default fetchers;
