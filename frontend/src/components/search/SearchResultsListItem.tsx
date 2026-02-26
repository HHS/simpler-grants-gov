"use client";

import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";
import { getAgencyDisplayName } from "src/utils/search/filterUtils";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { USWDSIcon } from "src/components/USWDSIcon";
import SearchResultListItemStatus from "./SearchResultListItemStatus";

interface SearchResultsListItemProps {
  opportunity: BaseOpportunity;
  saved?: boolean;
  index: number;
  page?: number;
  onShareClick?: () => void;
}

const metadataBorderClasses = `
  display-block
  tablet:display-inline-block
  tablet:border-left-1px
  tablet:padding-x-1
  tablet:margin-left-neg-1
  tablet:margin-right-1
  tablet:border-base-lighter
  `;

const resultBorderClasses = `
  border-1px
  border-base-lighter
  padding-x-2
  padding-y-105
  margin-bottom-2
  text-base-darker
  `;

export default function SearchResultsListItem({
  opportunity,
  saved = false,
  index,
  page = 1,
  onShareClick,
}: SearchResultsListItemProps) {
  const t = useTranslations("Search");

  return (
    <div className={resultBorderClasses}>
      <div className="grid-row grid-gap">
        <div className="desktop:grid-col-fill">
          <div className="grid-row flex-column">
            <div className="grid-col tablet:order-2">
              <h2 className="margin-y-105 line-height-sans-2">
                <Link
                  href={`/opportunity/${opportunity?.opportunity_id}`}
                  className="usa-link usa-link"
                  id={`search-result-link-${page}-${index + 1}`}
                >
                  {opportunity?.opportunity_title}
                </Link>
              </h2>
            </div>
            <div className="font-sans-xs display-flex flex-wrap">
              <SearchResultListItemStatus
                archiveDate={opportunity?.summary?.archive_date}
                archivedString={t("resultsListItem.status.archived")}
                closedDate={opportunity?.summary?.close_date}
                closedString={t("resultsListItem.status.closed")}
                forecastedString={t("resultsListItem.status.forecasted")}
                postedString={t("resultsListItem.status.posted")}
                status={opportunity?.opportunity_status}
              />
              <span
                className={`${metadataBorderClasses} tablet:order-0 order-2`}
              >
                <strong>
                  {opportunity.opportunity_status === "forecasted"
                    ? t("resultsListItem.summary.forecasted")
                    : t("resultsListItem.summary.posted")}
                </strong>
                {opportunity?.summary?.post_date
                  ? formatDate(opportunity?.summary?.post_date)
                  : "--"}
              </span>
              {saved && (
                <span className="padding-x-105 padding-y-2px bg-base-lighter display-flex flex-align-center font-sans-3xs radius-sm">
                  <USWDSIcon
                    name="star"
                    className="text-accent-warm-dark button-icon-md padding-right-05"
                  />
                  {t("opportunitySaved")}
                </span>
              )}
              <div className="width-full tablet:width-auto" />
            </div>
            <div className="grid-col tablet:order-2 overflow-hidden font-sans-xs">
              <span className={metadataBorderClasses}>
                <strong>{t("resultsListItem.summary.agency")}</strong>
                {getAgencyDisplayName(opportunity)}
              </span>
            </div>
            <div className="grid-col tablet:order-3 overflow-hidden font-body-xs">
              <strong>{t("resultsListItem.opportunityNumber")}</strong>
              {opportunity?.opportunity_number}
            </div>
          </div>
        </div>
        <div className="desktop:grid-col-auto">
          <div className="overflow-hidden font-sans-xs">
            {/* TODO: Better way to format as a dollar amounts */}
            <span className="desktop:display-block text-right desktop:margin-right-0 desktop:padding-right-0">
              <strong>{t("resultsListItem.awardCeiling")}</strong>
              <span className="desktop:display-block desktop:font-sans-lg text-ls-neg-3 text-right">
                ${opportunity?.summary?.award_ceiling?.toLocaleString() || "--"}
              </span>
            </span>
            <span className="border-left-1px border-base-lighter margin-left-1 padding-left-1 text-right  desktop:border-0 desktop:display-block desktop:margin-left-3 desktop:margin-right-0 desktop:padding-right-0">
              <strong>{t("resultsListItem.floor")}</strong>
              {opportunity?.summary?.award_floor?.toLocaleString() || "--"}
            </span>
          </div>
          {/* {saved && onShareClick ? (
            <div className="margin-top-1 text-right">
              <button
                type="button"
                className="usa-button usa-button--unstyled font-sans-2xs"
                onClick={onShareClick}
              >
                {t("callToAction.shareWithOrganization")}
              </button>
            </div>
          ) : null} */}
        </div>
      </div>
    </div>
  );
}
