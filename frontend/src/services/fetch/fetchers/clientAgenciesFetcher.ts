import { RelevantAgencyRecord } from "src/types/search/searchFilterTypes";

export const agencySearch = async (
  keyword: string,
  selectedStatuses?: string[],
) => {
  const response = await fetch("/api/agencies", {
    method: "POST",
    body: JSON.stringify({
      keyword,
      selectedStatuses,
    }),
  });
  if (response.ok && response.status === 200) {
    const data = (await response.json()) as RelevantAgencyRecord[];
    return data;
  }
  throw new Error(`Unable to fetch agencies search: ${response.status}`);
};
