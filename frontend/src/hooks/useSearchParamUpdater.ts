import { usePathname, useSearchParams } from "next/navigation";

export function useSearchParamUpdater() {
  const searchParams = useSearchParams();
  const pathname = usePathname() || "";

  // Singular string param updates include: search input, dropdown, and page numbers
  // Multiple param updates include filters: Opportunity Status, Funding Instrument, Eligibility, Agency, Category
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
    newPath = newPath.replaceAll("%2C", ",");

    window.history.pushState({}, "", newPath);
  };

  return {
    updateQueryParams,
  };
}
