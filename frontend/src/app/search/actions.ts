// All exports in this file are server actions
"use server";

import { SearchFetcherProps } from "../../services/searchfetcher/SearchFetcher";
import { SearchResponseData } from "../api/SearchOpportunityAPI";
import { getSearchFetcher } from "../../services/searchfetcher/SearchFetcherUtil";

// Gets MockSearchFetcher or APISearchFetcher based on environment variable
const searchFetcher = getSearchFetcher();

// Server action called when SearchForm is submitted
export async function updateResults(
  prevState: SearchResponseData,
  formData: FormData,
) {
  const pageValue = formData.get("currentPage");
  const page = pageValue ? parseInt(pageValue as string, 10) : 1;
  const safePage = !isNaN(page) && page > 0 ? page : 1;

  console.log("page in server action => ", safePage);
  const searchProps: SearchFetcherProps = {
    page: safePage,
  };
  return await searchFetcher.fetchOpportunities(searchProps);
}
