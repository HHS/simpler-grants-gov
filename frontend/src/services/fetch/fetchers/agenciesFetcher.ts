"server only";

import { ApiRequestError } from "src/errors";
import {
  fetchAgencies,
  searchAgencies,
} from "src/services/fetch/fetchers/fetchers";
import { RelevantAgencyRecord } from "src/types/search/searchFilterTypes";
import { flattenAgencies } from "src/utils/search/filterUtils";

// would have called this getAgencies, but technically it's a POST
export const obtainAgencies = async (): Promise<RelevantAgencyRecord[]> => {
  const response = await fetchAgencies({
    body: {
      pagination: {
        page_offset: 1,
        page_size: 1500, // 969 agencies in prod as of 3/7/25
        sort_order: [
          {
            order_by: "created_at",
            sort_direction: "ascending",
          },
        ],
      },
      filters: { active: true },
    },
    nextOptions: {
      revalidate: 604800,
    },
  });
  const { data } = (await response.json()) as { data: RelevantAgencyRecord[] };
  return data;
};

export const performAgencySearch = async (
  keyword?: string,
): Promise<RelevantAgencyRecord[]> => {
  const response = await searchAgencies({
    body: {
      pagination: {
        page_offset: 1,
        page_size: 1500, // 969 agencies in prod as of 3/7/25
        sort_order: [
          {
            order_by: "agency_code",
            sort_direction: "ascending",
          },
        ],
      },
      filters: { active: true },
      query: keyword || "",
    },
  });
  if (!response || response.status !== 200) {
    throw new ApiRequestError(
      "Error fetching agency options",
      "APIRequestError",
      response.status,
    );
  }

  const { data } = (await response.json()) as {
    data: RelevantAgencyRecord[];
  };

  // need to pull out top level agencies from each search result and flatten
  return data;
};

export const searchAndFlattenAgencies = async (
  keyword: string,
): Promise<RelevantAgencyRecord[]> => {
  let agencies = [];
  try {
    agencies = await performAgencySearch(keyword);
  } catch (e) {
    console.error("Error searching agency options");
    throw e;
  }
  try {
    return flattenAgencies(agencies);
  } catch (e) {
    console.error("Error flattening agency search results");
    throw e;
  }
};
