"use client";

import { usePathname, useSearchParams } from "next/navigation";

export function useSearchParamUpdater() {
  const searchParams = useSearchParams();
  const pathname = usePathname() || "";

  // Singular string-type param updates include: search input, dropdown, and page numbers
  // Multi/Set-type param updates include filters: Opportunity Status, Funding Instrument, Eligibility, Agency, Category
  const updateQueryParams = (
    queryParamValue: string | Set<string>,
    key: string,
  ) => {
    const params = new URLSearchParams(searchParams || {});

    const finalQueryParamValue =
      queryParamValue instanceof Set
        ? Array.from(queryParamValue).join(",")
        : queryParamValue;

    if (finalQueryParamValue) {
      params.set(key, finalQueryParamValue);
    } else {
      params.delete(key);
    }

    let newPath = `${pathname}?${params.toString()}`;
    newPath = removeURLEncodedCommas(newPath);
    newPath = removeQuestionMarkIfNoParams(params, newPath);

    window.history.pushState({}, "", newPath);
  };

  return {
    updateQueryParams,
  };
}

function removeURLEncodedCommas(newPath: string) {
  return newPath.replaceAll("%2C", ",");
}

// When we remove all query params we also need to remove
// the question mark from the URL
function removeQuestionMarkIfNoParams(
  params: URLSearchParams,
  newPath: string,
) {
  return params.toString() === "" ? newPath.replaceAll("?", "") : newPath;
}
