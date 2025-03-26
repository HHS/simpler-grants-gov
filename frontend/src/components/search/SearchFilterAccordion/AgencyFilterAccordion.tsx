import { useTranslations } from "next-intl";

import SearchFilterAccordion, {
  FilterOption,
} from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";

// functionality differs depending on whether `agencyOptions` or `agencyOptionsPromise` is passed
// with prefetched options we have a synchronous render
// with a Promise we have an async render with Suspense
export async function AgencyFilterAccordion({
  query,
  agencyOptionsPromise,
}: {
  query: Set<string>;
  agencyOptionsPromise: Promise<FilterOption[]>;
}) {
  const t = useTranslations("Search");

  let agencies: FilterOption[];
  try {
    agencies = await agencyOptionsPromise;
  } catch (e) {
    // Come back to this to show the user an error
    console.error("Unable to fetch agencies for filter list", e);
    agencies = [];
  }
  return (
    <SearchFilterAccordion
      filterOptions={agencies}
      query={query}
      queryParamKey={"agency"}
      title={t("accordion.titles.agency")}
      // agency filters will not show facet counts
    />
  );
}
