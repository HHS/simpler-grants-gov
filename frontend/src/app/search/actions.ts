// All exports in this file are server actions
"use server";

import { FormDataService } from "../../services/search/FormDataService";
import { SearchAPIResponse } from "../../types/search/searchResponseTypes";
import { getSearchFetcher } from "../../services/search/searchfetcher/SearchFetcherUtil";

// Gets MockSearchFetcher or APISearchFetcher based on environment variable
const searchFetcher = getSearchFetcher();

// Server action called when SearchForm is submitted
export async function updateResults(
  prevState: SearchAPIResponse,
  formData: FormData,
): Promise<SearchAPIResponse> {
  const formDataService = new FormDataService(formData);
  const searchProps = formDataService.processFormData();

  console.log("searchProps => ", searchProps);

  return await searchFetcher.fetchOpportunities(searchProps);
}
