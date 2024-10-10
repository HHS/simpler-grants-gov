import { Metadata } from "next";
import SearchResults from "src/app/[locale]/search/SearchResults";
import withFeatureFlag from "src/hoc/search/withFeatureFlag";
import { Breakpoints } from "src/types/uiTypes";
import { convertSearchParamsToProperTypes } from "src/utils/search/convertSearchParamsToProperTypes";

import { useTranslations } from "next-intl";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

import ContentDisplayToggle from "src/components/ContentDisplayToggle";
import SearchBar from "src/components/search/SearchBar";
import SearchFilters from "src/components/search/SearchFilters";
import QueryProvider from "./QueryProvider";

export async function generateMetadata() {
  const t = await getTranslations({ locale: "en" });
  const meta: Metadata = {
    title: t("Search.title"),
    description: t("Index.meta_description"),
  };
  return meta;
}

interface searchParamsTypes {
  agency?: string;
  category?: string;
  eligibility?: string;
  fundingInstrument?: string;
  page?: string;
  query?: string;
  sortby?: string;
  status?: string;
  [key: string]: string | undefined;
}

function Search({ searchParams }: { searchParams: searchParamsTypes }) {
  unstable_setRequestLocale("en");
  const t = useTranslations("Search");
  const convertedSearchParams = convertSearchParamsToProperTypes(searchParams);
  const { agency, category, eligibility, fundingInstrument, query, status } =
    convertedSearchParams;

  if (!("page" in searchParams)) {
    searchParams.page = "1";
  }

  return (
    <>
      <QueryProvider>
        <div className="grid-container">
          <div className="search-bar">
            <SearchBar query={query} />
          </div>
          <div className="grid-row grid-gap">
            <div className="tablet:grid-col-4">
              <ContentDisplayToggle
                showCallToAction={t("filterDisplayToggle.showFilters")}
                hideCallToAction={t("filterDisplayToggle.hideFilters")}
                breakpoint={Breakpoints.TABLET}
              >
                <SearchFilters
                  opportunityStatus={status}
                  eligibility={eligibility}
                  category={category}
                  fundingInstrument={fundingInstrument}
                  agency={agency}
                />
              </ContentDisplayToggle>
            </div>
            <div className="tablet:grid-col-8">
              <SearchResults
                searchParams={convertedSearchParams}
                query={query}
                loadingMessage={t("loading")}
              ></SearchResults>
            </div>
          </div>
        </div>
      </QueryProvider>
    </>
  );
}

// Exports page behind a feature flag
export default withFeatureFlag(Search, "showSearchV0");
