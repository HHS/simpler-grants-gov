import { FilterOption } from "src/types/search/searchFilterTypes";

export const agencySearch = async (searchKeyword: string) => {
  const response = await fetch("/api/agencies", {
    method: "POST",
    body: JSON.stringify({
      keyword: searchKeyword,
    }),
  });
  if (response.ok && response.status === 200) {
    const data = (await response.json()) as FilterOption[];
    return data;
  }
  throw new Error(`Unable to fetch agencies search: ${response.status}`);
};
