import Breadcrumbs from "../../components/Breadcrumbs";
import { GridContainer } from "@trussworks/react-uswds";
import React from "react";
import { SEARCH_CRUMBS } from "../../constants/breadcrumbs";

const SearchCallToAction: React.FC = () => {
  return (
    <>
      {/* <BetaAlert /> */}
      <Breadcrumbs breadcrumbList={SEARCH_CRUMBS} />
      <GridContainer>
        <h1 className="margin-0 tablet-lg:font-sans-xl desktop-lg:font-sans-2xl">
          Search funding opportunities
        </h1>
        <p className="font-serif-md tablet-lg:font-serif-lg usa-intro margin-top-2">
          We’re incrementally improving this experimental search page. How can
          we make it easier to discover grants that are right for you? Let us
          know at <a href="mailto:simpler@grants.gov">simpler@grants.gov</a>.
        </p>
      </GridContainer>
    </>
  );
};

export default SearchCallToAction;
