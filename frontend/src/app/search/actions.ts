// All exports in this file are server actions
"use server";

import { SearchAPIResponse } from "../../types/searchTypes";
import { SearchFetcherProps } from "../../services/searchfetcher/SearchFetcher";
import { getSearchFetcher } from "../../services/searchfetcher/SearchFetcherUtil";

// Gets MockSearchFetcher or APISearchFetcher based on environment variable
const searchFetcher = getSearchFetcher();

// Server action called when SearchForm is submitted
export async function updateResults(
  prevState: SearchAPIResponse,
  formData: FormData,
): Promise<SearchAPIResponse> {
  console.log("formData => ", formData);
  const pageValue = formData.get("currentPage");
  const page = pageValue ? parseInt(pageValue as string, 10) : 1;
  const safePage = !isNaN(page) && page > 0 ? page : 1;

  const searchProps: SearchFetcherProps = {
    page: safePage,
  };

  return await searchFetcher.fetchOpportunities(searchProps);
}
