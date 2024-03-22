"use client";

import { Opportunity } from "src/types/search/searchResponseTypes";
import { formatDate } from "../../utils/dateUtil";

interface SearchResultsListItemProps {
  opportunity: Opportunity;
}

export default function SearchResultsListItem({
  opportunity,
}: SearchResultsListItemProps) {
  const opportunityURL =
    process.env.NEXT_PUBLIC_ENVIRONMENT === "prod"
      ? "https://grants.gov"
      : "https://test.grants.gov";

  const metadataBorderClasses = `
    display-block
    tablet:display-inline-block
    tablet:border-left-1px
    tablet:padding-x-1
    tablet:margin-left-neg-1
    tablet:margin-right-1
    tablet:border-base-lighter
  `;

  return (
    <div
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
                <a
                  href={`${opportunityURL}/search-results-detail/${opportunity?.opportunity_id}`}
                  className="usa-link usa-link--external"
                >
                  {opportunity?.opportunity_title}
                </a>
              </h2>
            </div>
            <div className="grid-col tablet:order-1 overflow-hidden font-body-xs">
              {opportunity.opportunity_status === "archived" && (
                <span className={metadataBorderClasses}>
                  <strong>Archived:</strong>{" "}
                  {opportunity?.summary?.archive_date
                    ? formatDate(opportunity?.summary?.archive_date)
                    : "--"}
                </span>
              )}
              {(opportunity?.opportunity_status === "archived" ||
                opportunity?.opportunity_status === "closed") &&
                opportunity?.summary?.close_date && (
                  <span className={metadataBorderClasses}>
                    <strong>Closed:</strong>{" "}
                    {opportunity?.summary?.close_date
                      ? formatDate(opportunity?.summary?.close_date)
                      : "--"}
                  </span>
                )}
              {opportunity?.opportunity_status === "posted" && (
                <span className={metadataBorderClasses}>
                  <span className="usa-tag bg-accent-warm-dark">
                    <strong>Closing:</strong>{" "}
                    <span className="text-no-uppercase">
                      {opportunity?.summary?.close_date
                        ? formatDate(opportunity?.summary?.close_date)
                        : "--"}
                    </span>
                  </span>
                </span>
              )}
              {opportunity?.opportunity_status === "forecasted" && (
                <span className={metadataBorderClasses}>
                  <span className="usa-tag">
                    <strong>Forecasted</strong>
                  </span>
                </span>
              )}
              <span className={metadataBorderClasses}>
                <strong>Posted:</strong>{" "}
                {opportunity?.summary?.post_date
                  ? formatDate(opportunity?.summary?.post_date)
                  : "--"}
              </span>
            </div>
            <div className="grid-col tablet:order-3 overflow-hidden font-body-xs">
              <span className={metadataBorderClasses}>
                <strong>Agency:</strong>{" "}
                {opportunity?.summary?.agency_name
                  ? opportunity?.summary?.agency_name
                  : "--"}
              </span>
              <span className={metadataBorderClasses}>
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
                ${opportunity?.summary?.award_ceiling?.toLocaleString() || "--"}
              </span>
            </span>
            <span className="display-block desktop:text-right">
              <strong>Floor:</strong> $
              {opportunity?.summary?.award_floor?.toLocaleString() || "--"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
