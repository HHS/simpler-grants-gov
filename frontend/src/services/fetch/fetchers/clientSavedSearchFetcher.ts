import { SavedSearchRecord } from "src/types/search/searchRequestTypes";
import { filterSearchParams } from "src/utils/search/searchFormatUtils";

import { ReadonlyURLSearchParams } from "next/navigation";

// make call from client to Next server to initiate saving a search
export const saveSearch = async (
  clientFetch,
  name: string,
  searchParams: ReadonlyURLSearchParams,
  token?: string,
) => {
  if (!token) return;
  // send up a filtered set of params, converted to an object
  // we will do the further filter and pagination object building on the server
  const savedSearchParams = filterSearchParams(
    Object.fromEntries(searchParams.entries()),
  );
  const res = await clientFetch("/api/user/saved-searches", {
    method: "POST",
    body: JSON.stringify({ ...savedSearchParams, name }),
  });
  if (res.ok && res.status === 200) {
    const data = (await res.json()) as { id: string };
    return data;
  } else {
    throw new Error(`Error posting saved search: ${res.status}`);
  }
};

// make call from client to Next server to fetch saved searches
export const obtainSavedSearches = async (
  token?: string,
): Promise<SavedSearchRecord[]> => {
  if (!token) {
    throw new Error("Not logged in, can't fetch saved searches");
  }
  const res = await fetch("/api/user/saved-searches/list", {
    method: "POST",
  });
  if (res.ok && res.status === 200) {
    const data = (await res.json()) as SavedSearchRecord[];
    return data;
  } else {
    throw new Error(`Error fetching saved searches: ${res.status}`);
  }
};

// make call from client to Next server to initiate editing a saved search
export const editSavedSearchName = async (
  name: string,
  searchId: string,
  token?: string,
) => {
  if (!token) return;
  const res = await fetch("/api/user/saved-searches", {
    method: "PUT",
    body: JSON.stringify({ name, searchId }),
  });
  if (!res.ok || res.status !== 200) {
    throw new Error(`Error updating saved search: ${res.status}`);
  }
};

// make call from client to Next server to initiate deleting a saved search
export const deleteSavedSearch = async (searchId: string, token?: string) => {
  if (!token) return;
  const res = await fetch("/api/user/saved-searches", {
    method: "DELETE",
    body: JSON.stringify({ searchId }),
  });
  if (!res.ok || res.status !== 200) {
    throw new Error(`Error deleting saved search: ${res.status}`);
  }
};
