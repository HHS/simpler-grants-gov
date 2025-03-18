import {
  SavedSearchRecord,
  SearchRequestBody,
} from "src/types/search/searchRequestTypes";

import { fetchUserWithMethod } from "./fetchers";

type SavedSearchResponse = {
  status_code: number;
  message: string;
  data: {
    saved_search_id?: string;
  } | null;
};

// make call from server to API to save a search
export const handleSavedSearch = async (
  token: string,
  userId: string,
  savedSearch: SearchRequestBody,
  name: string,
): Promise<SavedSearchResponse> => {
  const response = await fetchUserWithMethod("POST")({
    subPath: `${userId}/saved-searches`,
    additionalHeaders: {
      "X-SGG-Token": token,
    },
    body: { search_query: savedSearch, name },
  });
  return (await response.json()) as SavedSearchResponse;
};

// make call from server to API to update a saved search
export const handleUpdateSavedSearch = async (
  token: string,
  userId: string,
  searchId: string,
  name: string,
): Promise<SavedSearchResponse> => {
  const response = await fetchUserWithMethod("PUT")({
    subPath: `${userId}/saved-searches/${searchId}`,
    additionalHeaders: {
      "X-SGG-Token": token,
    },
    body: { name },
  });
  return await response.json();
};

export const fetchSavedSearches = async (
  token: string,
  userId: string,
): Promise<SavedSearchRecord[]> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const body = {
    pagination: {
      page_offset: 1,
      page_size: 25,
      sort_order: [
        {
          order_by: "name",
          sort_direction: "ascending",
        },
      ],
    },
  };
  const subPath = `${userId}/saved-searches/list`;
  const resp = await fetchUserWithMethod("POST")({
    subPath,
    additionalHeaders: ssgToken,
    body,
  });
  const json = (await resp.json()) as { data: [] };
  return json.data;
};
