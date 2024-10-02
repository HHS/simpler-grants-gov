import { useTranslations } from "next-intl";
import { unstable_setRequestLocale } from "next-intl/server";

import SearchFilterAccordion from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import {
  agencyOptions,
  categoryOptions,
  eligibilityOptions,
  fundingOptions,
} from "src/components/search/SearchFilterAccordion/SearchFilterOptions";
import SearchOpportunityStatus from "src/components/search/SearchOpportunityStatus";

export default function SearchFilters({
  fundingInstrument,
  eligibility,
  agency,
  category,
  opportunityStatus,
}: {
  fundingInstrument: Set<string>;
  eligibility: Set<string>;
  agency: Set<string>;
  category: Set<string>;
  opportunityStatus: Set<string>;
}) {
  unstable_setRequestLocale("en");
  const t = useTranslations("Search");

  return (
    <>
      <SearchOpportunityStatus query={opportunityStatus} />
      <SearchFilterAccordion
        filterOptions={fundingOptions}
        query={fundingInstrument}
        queryParamKey="fundingInstrument"
        title={t("accordion.titles.funding")}
      />
      <SearchFilterAccordion
        filterOptions={eligibilityOptions}
        query={eligibility}
        queryParamKey={"eligibility"}
        title={t("accordion.titles.eligibility")}
      />
      <SearchFilterAccordion
        filterOptions={agencyOptions}
        query={agency}
        queryParamKey={"agency"}
        title={t("accordion.titles.agency")}
      />
      <SearchFilterAccordion
        filterOptions={categoryOptions}
        query={category}
        queryParamKey={"category"}
        title={t("accordion.titles.category")}
      />
    </>
  );
}
