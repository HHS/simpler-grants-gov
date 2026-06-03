"use client";

import { SavedOpportunityTags } from "src/app/[locale]/(base)/workspace/saved-opportunities/_components/SavedOpportunityTags";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";
import { getAgencyDisplayName } from "src/utils/search/filterUtils";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ReactElement } from "react";

import { SavedOpportunityTag } from "src/components/saved-opportunities/buildSavedOpportunityTags";
import SearchResultsListItemStatus from "./SearchResultsListItemStatus";

interface SearchResultsListItemProps {
  opportunity: BaseOpportunity;
  saved?: boolean;
  showShareButton?: boolean;
  index: number;
  page?: number;
  onShareClick?: (buttonElement: HTMLButtonElement) => void;
  savedOpportunityTags?: SavedOpportunityTag[];
}

export default function SearchResultsListItem({
  opportunity,
  saved = false,
  showShareButton = false,
  index,
  page = 1,
  onShareClick,
  savedOpportunityTags,
}: SearchResultsListItemProps): ReactElement {
  const t = useTranslations("Search");
  const savedOpportunityTagsToRender = saved
    ? (savedOpportunityTags ?? [])
    : [];

  const shouldRenderSavedOpportunityTags =
    savedOpportunityTagsToRender.length > 0;

  const opportunityTitleId = `search-result-title-${page}-${index + 1}`;
  const searchResultLinkId = `search-result-link-${page}-${index + 1}`;
  const shareButtonId = `share-opportunity-button-${opportunity.opportunity_id}`;
  const postedOrForecastedLabel =
    opportunity.opportunity_status === "forecasted"
      ? t("resultsListItem.summary.forecasted")
      : t("resultsListItem.summary.posted");
  return (
    <article
      className="saved-opportunity-card"
      aria-labelledby={opportunityTitleId}
    >
      <h2 id={opportunityTitleId} className="saved-opportunity-card__title">
        <Link
          href={`/opportunity/${opportunity.opportunity_id}`}
          className="usa-link"
          id={searchResultLinkId}
        >
          {opportunity.opportunity_title}
        </Link>
      </h2>
      <div className="saved-opportunity-card__status-row">
        <dl className="search-result-status">
          <SearchResultsListItemStatus
            archiveDate={opportunity.summary?.archive_date}
            archivedString={t("resultsListItem.status.archived")}
            closedDate={opportunity.summary?.close_date}
            closedString={t("resultsListItem.status.closed")}
            forecastedString={t("resultsListItem.status.forecasted")}
            postedString={t("resultsListItem.status.posted")}
            status={opportunity.opportunity_status}
          />
          <div className="saved-opportunity-card__posted-date">
            <dt className="saved-opportunity-card__posted-date-term">
              {postedOrForecastedLabel}
            </dt>
            <dd className="saved-opportunity-card__posted-date-description">
              {opportunity.summary?.post_date
                ? formatDate(opportunity.summary.post_date)
                : "--"}
            </dd>
          </div>
        </dl>
      </div>

      <dl className="saved-opportunity-card__metadata">
        <div className="saved-opportunity-card__metadata-item">
          <dt className="saved-opportunity-card__metadata-term">
            {t("resultsListItem.summary.agency")}
          </dt>
          <dd className="saved-opportunity-card__metadata-description">
            {getAgencyDisplayName(opportunity)}
          </dd>
        </div>
        <div className="saved-opportunity-card__metadata-item">
          <dt className="saved-opportunity-card__metadata-term">
            {t("resultsListItem.opportunityNumber")}
          </dt>
          <dd className="saved-opportunity-card__metadata-description">
            {opportunity.opportunity_number}
          </dd>
        </div>
      </dl>
      <dl
        className="saved-opportunity-card__award"
        aria-label={t("resultsListItem.awardInformation")}
      >
        <div className="saved-opportunity-card__award-item">
          <dt className="saved-opportunity-card__award-term">
            {t("resultsListItem.awardCeiling")}
          </dt>
          <dd className="saved-opportunity-card__award-description saved-opportunity-card__award-description--maximum">
            ${opportunity.summary?.award_ceiling?.toLocaleString() || "--"}
          </dd>
        </div>
        <div className="saved-opportunity-card__award-item">
          <dt className="saved-opportunity-card__award-term">
            {t("resultsListItem.floor")}
          </dt>
          <dd className="saved-opportunity-card__award-description">
            ${opportunity.summary?.award_floor?.toLocaleString() || "--"}
          </dd>
        </div>
      </dl>
      {shouldRenderSavedOpportunityTags ? (
        <div className="saved-opportunity-card__tags">
          <SavedOpportunityTags
            labelId={`saved-opportunity-tags-label-${opportunity.opportunity_id}`}
            tags={savedOpportunityTagsToRender}
          />
        </div>
      ) : null}
      {showShareButton && onShareClick ? (
        <div className="saved-opportunity-card__action border-top border-base-lighter padding-top-1 tablet:border-top-0">
          <button
            id={shareButtonId}
            data-testid="share-opportunity-button-id"
            type="button"
            className="usa-button usa-button--unstyled font-sans-2xs"
            onClick={(event) => onShareClick(event.currentTarget)}
          >
            {t("callToAction.sharingOptions")}
          </button>
        </div>
      ) : null}
    </article>
  );
}
