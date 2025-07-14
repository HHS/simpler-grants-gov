"server only";

import { ApiRequestError } from "src/errors";
import { JSONRequestBody } from "src/services/fetch/fetcherHelpers";
import { searchAgencies } from "src/services/fetch/fetchers/fetchers";
import { RelevantAgencyRecord } from "src/types/search/searchFilterTypes";
import { flattenAgencies } from "src/utils/search/filterUtils";
import { getStatusValueForAgencySearch } from "src/utils/search/searchUtils";

export const performAgencySearch = async ({
  keyword,
  selectedStatuses,
}: {
  keyword?: string;
  selectedStatuses?: string[];
} = {}): Promise<RelevantAgencyRecord[]> => {
  const requestBody: JSONRequestBody = {
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
    filters: {
      opportunity_statuses: {
        one_of: getStatusValueForAgencySearch(selectedStatuses),
      },
    },
  };
  if (keyword) {
    requestBody.query = keyword;
  }
  const response = await searchAgencies({
    body: requestBody,
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
  selectedStatuses?: string[],
): Promise<RelevantAgencyRecord[]> => {
  let agencies = [];
  try {
    agencies = await performAgencySearch({
      keyword,
      selectedStatuses: selectedStatuses || undefined,
    });
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
