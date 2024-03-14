import Loading from "../../app/search/loading";
// SearchResultsList.tsx
import React from "react";
import { SearchResponseData } from "../../app/api/SearchOpportunityAPI";
import { formatDate } from "../../utils/dateUtil";
import { useFormStatus } from "react-dom";

interface SearchResultsListProps {
  searchResults: SearchResponseData;
  maxPaginationError: boolean;
}

const SearchResultsList: React.FC<SearchResultsListProps> = ({
  searchResults,
  maxPaginationError,
}) => {
  const { pending } = useFormStatus();

  if (pending) {
    return <Loading />;
  }

  return (
    <ul className="usa-list--unstyled">
        {/* TODO #1485: show proper USWDS error  */}
      {maxPaginationError && (
        <h4>
          You're trying to access opportunity results that are beyond the last
          page of data.
        </h4>
      )}
      {searchResults.map((opportunity) => (
        <li
          key={opportunity?.opportunity_id}
          className="
              border-1px
              border-base-lighter
              padding-x-2
              padding-y-105
              margin-bottom-2
              text-base-darker
            "
        >
          <div className="grid-row grid-gap">
            <div className="desktop:grid-col-fill">
              <div className="grid-row flex-column">
                <div className="grid-col tablet:order-2">
                  <h2 className="margin-y-105 line-height-serif-2">
                    {/* TODO: href here needs to be set to:
                        dev/staging:  https://test.grants.gov/search-results-detail/<opportunity_id>
                        local/prod: https://grants.gov/search-results-detail/<opportunity_id>
                    */}
                    <a href="#" className="usa-link usa-link--external">
                      {opportunity?.opportunity_title}
                    </a>
                  </h2>
                </div>
                {/*

                  TODO: conditionally show dates if they exist
                  and add color based on status

                  */}
                <div className="grid-col tablet:order-1 overflow-hidden">
                  <span
                    className="
                        display-block
                        tablet:display-inline-block
                        tablet:border-left-1px
                        tablet:padding-x-1
                        tablet:margin-left-neg-1
                        tablet:margin-right-1
                        tablet:border-base-lighter
                      "
                  >
                    <span className="usa-tag bg-accent-warm-dark">
                      <strong className="">Closing:</strong>{" "}
                      {/* TODO: format date */}
                      {opportunity?.summary?.close_date}
                    </span>
                  </span>
                  <span
                    className="
                        display-block
                        tablet:display-inline-block
                        tablet:border-left-1px
                        tablet:padding-x-1
                        tablet:margin-left-neg-1
                        tablet:margin-right-1
                        tablet:border-base-lighter
                      "
                  >
                    <strong>Posted:</strong>{" "}
                    {formatDate(opportunity?.summary?.post_date)}
                  </span>
                </div>
                <div className="grid-col tablet:order-3 overflow-hidden">
                  <span
                    className="
                        display-block
                        tablet:display-inline-block
                        tablet:border-left-1px
                        tablet:padding-x-1
                        tablet:margin-left-neg-1
                        tablet:margin-right-1
                        tablet:border-base-lighter
                      "
                  >
                    <strong>Agency:</strong> {opportunity?.summary?.agency_name}
                  </span>
                  <span
                    className="
                        display-block
                        tablet:display-inline-block
                        tablet:border-left-1px
                        tablet:padding-x-1
                        tablet:margin-left-neg-1
                        tablet:margin-right-1
                        tablet:border-base-lighter
                      "
                  >
                    <strong>Opportunity Number:</strong>{" "}
                    {opportunity?.opportunity_number}
                  </span>
                </div>
              </div>
            </div>
            <div className="desktop:grid-col-auto">
              <div className="overflow-hidden">
                {/* TODO: Better way to format as a dollar amounts */}
                <span className="display-block desktop:text-right">
                  <strong>Award Ceiling:</strong>{" "}
                  <span className="desktop:display-block desktop:font-sans-lg text-ls-neg-3">
                    $
                    {opportunity?.summary?.award_ceiling?.toLocaleString() ||
                      "--"}
                  </span>
                </span>
                <span className="display-block desktop:text-right">
                  <strong>Floor:</strong> $
                  {opportunity?.summary?.award_floor?.toLocaleString() || "--"}
                </span>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default SearchResultsList;
