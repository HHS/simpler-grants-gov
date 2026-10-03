import { getSession } from "src/services/auth/session";
import { APIResponse, PaginationInfo } from "src/types/apiResponseTypes";
import {
  SavedSearchRecord,
  SearchRequestBody,
} from "src/types/search/searchRequestTypes";

import { fetchUserWithMethod } from "./fetchers";

interface SavedSearchResponse extends APIResponse {
  data: {
    saved_search_id?: string;
  };
}

export type PaginatedSavedSearches = {
  savedSearches: SavedSearchRecord[];
  paginationInfo?: PaginationInfo;
};

// make call from server to API to save a search
export const handleSavedSearch = async (
  userId: string,
  savedSearch: SearchRequestBody,
  name: string,
): Promise<SavedSearchResponse> => {
  const response = await fetchUserWithMethod("POST")({
    subPath: `${userId}/saved-searches`,
    body: { search_query: savedSearch, name },
  });
  return (await response.json()) as SavedSearchResponse;
};

// make call from server to API to update a saved search
export const handleUpdateSavedSearch = async (
  userId: string,
  searchId: string,
  name: string,
): Promise<APIResponse> => {
  const response = await fetchUserWithMethod("PUT")({
    subPath: `${userId}/saved-searches/${searchId}`,
    body: { name },
  });
  return (await response.json()) as APIResponse;
};

// make call from server to API to update a saved search
export const handleDeleteSavedSearch = async (
  userId: string,
  searchId: string,
): Promise<APIResponse> => {
  const response = await fetchUserWithMethod("DELETE")({
    subPath: `${userId}/saved-searches/${searchId}`,
  });
  return (await response.json()) as APIResponse;
};

export const fetchSavedSearchesPaginated = async (
  page = 1,
): Promise<PaginatedSavedSearches> => {
  const session = await getSession();
  // Supplementary data: this renders on pages available to logged-out users, so a
  // missing token degrades to an empty list rather than throwing (unlike required-data
  // fetchers such as fetchApplications, which throw MissingAuthError).
  if (!session?.token) {
    return { savedSearches: [] };
  }
  const body = {
    pagination: {
      page_offset: page,
      page_size: 25,
      sort_order: [
        {
          order_by: "name",
          sort_direction: "ascending",
        },
      ],
    },
  };
  const subPath = `${session.user_id}/saved-searches/list`;
  const resp = await fetchUserWithMethod("POST")({
    subPath,
    body,
  });
  const json = (await resp.json()) as {
    data: SavedSearchRecord[];
    pagination_info?: PaginationInfo;
  };
  return {
    savedSearches: json.data,
    paginationInfo: json.pagination_info,
  };
};

export const fetchSavedSearches = async (): Promise<SavedSearchRecord[]> => {
  const { savedSearches } = await fetchSavedSearchesPaginated();
  return savedSearches;
};
