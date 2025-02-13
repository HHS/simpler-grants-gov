import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { Accordion } from "@trussworks/react-uswds";

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
  const title = t("accordion.titles.agency");

  let agencies: FilterOption[];
  try {
    agencies = await agencyOptionsPromise;
  } catch (e) {
    // Come back to this to show the user an error
    console.error("Unable to fetch agencies for filter list", e);
    agencies = [];
  }
  return (
    <Suspense
      fallback={
        <Accordion
          bordered={true}
          items={[
            {
              title,
              content: [],
              expanded: false,
              id: `opportunity-filter-agency-disabled`,
              headingLevel: "h2",
            },
          ]}
          multiselectable={true}
          className="margin-top-4"
        />
      }
    >
      <SearchFilterAccordion
        filterOptions={agencies}
        query={query}
        queryParamKey={"agency"}
        title={title}
      />
    </Suspense>
  );
}
