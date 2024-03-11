import { APISearchFetcher } from "../../services/searchfetcher/APISearchFetcher";
import { FeatureFlagsManager } from "../../services/FeatureFlagManager";
import { GridContainer } from "@trussworks/react-uswds";
import { MockSearchFetcher } from "../../services/searchfetcher/MockSearchFetcher";
// import { SEARCH_CRUMBS } from "src/constants/breadcrumbs";
// import Breadcrumbs from "src/components/Breadcrumbs";
import PageSEO from "src/components/PageSEO";
// Disable rule to allow server actions to be called without warning
/* eslint-disable react/jsx-no-bind, @typescript-eslint/no-misused-promises */
import React from "react";
import { SearchForm } from "./SearchForm";
import { cookies } from "next/headers";
import { fetchSearchOpportunities } from "../../services/searchfetcher/SearchFetcher";
import { notFound } from "next/navigation";

// import BetaAlert from "src/components/BetaAlert";

const useMockData = false;

const searchFetcher = useMockData
  ? new MockSearchFetcher()
  : new APISearchFetcher();

// TODO: use for i18n when ready
// interface RouteParams {
//   locale: string;
// }

interface ServerPageProps {
  params: {
    // route params
    slug: string;
  };
  searchParams: {
    // query string params
    [key: string]: string | string[] | undefined;
  };
}

export default async function Search({ searchParams }: ServerPageProps) {
  console.log("searchParams serer side =>", searchParams);

  const cookieStore = cookies();
  const ffManager = new FeatureFlagsManager(cookieStore);
  if (!ffManager.isFeatureEnabled("showSearchV0")) {
    return notFound();
  }

  console.log("calling server");
  const initialSearchResults = await fetchSearchOpportunities(searchFetcher);
  return (
    <>
      {/* TODO: i18n */}
      <PageSEO
        title="Search Funding Opportunities"
        description="Try out our experimental search page."
      />

      <GridContainer>
        {/* TODO: BetaAlert Breadcrumbs */}
        {/* <BetaAlert /> */}
        {/* <Breadcrumbs breadcrumbList={SEARCH_CRUMBS} /> */}
        <h1 className="margin-0 tablet-lg:font-sans-xl desktop-lg:font-sans-2xl">
          Search funding opportunities
        </h1>
        <p className="tablet-lg:font-sans-lg line-height-sans-3 usa-intro margin-top-2">
          We’re incrementally improving this experimental search page. How can
          we make it easier to discover grants that are right for you? Let us
          know at <a href="mailto:simpler@grants.gov">simpler@grants.gov</a>.
        </p>
      </GridContainer>

      <SearchForm initialSearchResults={initialSearchResults} />
    </>
  );
}
