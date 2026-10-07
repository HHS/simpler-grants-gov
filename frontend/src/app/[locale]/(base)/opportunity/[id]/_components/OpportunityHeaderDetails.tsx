import clsx from "clsx";
import { ExternalRoutes } from "src/constants/routes";
import {
  OpportunityAssistanceListing,
  OpportunityDetail,
  OpportunityStatus,
} from "src/types/opportunity/opportunityResponseTypes";
import { toShortMonthDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";

import { USWDSIcon } from "src/components/core/USWDSIcon";

const statusColorClasses: Record<OpportunityStatus, string> = {
  posted: "bg-accent-warm-light text-ink",
  forecasted: "bg-accent-cool-dark text-white",
  closed: "bg-base-dark text-white",
  archived: "bg-base-lighter text-ink",
};

export const OpportunityHeaderStatusTag = ({
  status,
}: {
  status: OpportunityStatus | null;
}) => {
  const t = useTranslations("OpportunityListing.header");
  // opportunities without a current summary (for example package only) have no status
  if (!status || !statusColorClasses[status]) return null;

  return (
    <span
      className={clsx(
        "usa-tag text-no-uppercase font-sans-2xs radius-sm margin-right-2",
        statusColorClasses[status],
      )}
      data-testid="opportunity-header-status"
    >
      {/* the visible tag is a single word, so screen readers get the full context instead */}
      <span aria-hidden="true">{t(`status.${status}`)}</span>
      <span className="usa-sr-only">{t(`statusAccessible.${status}`)}</span>
    </span>
  );
};

export const OpportunityHeaderAssistanceListings = ({
  assistanceListings,
}: {
  assistanceListings: OpportunityAssistanceListing[];
}) => {
  const t = useTranslations("OpportunityListing.header");

  return (
    <div data-testid="opportunity-header-assistance-listings">
      <a
        className="text-bold"
        href={ExternalRoutes.ASSISTANCE_LISTINGS}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("assistanceListings")}
        <span className="usa-sr-only"> {t("opensInNewTab")}</span>
        <USWDSIcon name="launch" className="margin-left-1 text-middle" />
      </a>
      <ul className="usa-list margin-top-1 margin-bottom-0">
        {assistanceListings.length ? (
          assistanceListings.map((listing) => (
            <li
              className="margin-bottom-0"
              key={`${listing.assistance_listing_number}-${listing.program_title}`}
            >
              {listing.assistance_listing_number}
              {" -- "}
              {listing.program_title}
            </li>
          ))
        ) : (
          <li className="margin-bottom-0">
            {t("assistanceListingsUnavailable")}
          </li>
        )}
      </ul>
    </div>
  );
};

const OpportunityHeaderDetails = ({
  opportunityData,
}: {
  opportunityData: OpportunityDetail;
}) => {
  const t = useTranslations("OpportunityListing.header");
  const lastUpdated = toShortMonthDate(opportunityData.updated_at);

  return (
    <div className="font-sans-sm">
      <p className="margin-top-0 margin-bottom-2">
        {t("agency")} {opportunityData.agency_name || "--"}
      </p>
      <OpportunityHeaderAssistanceListings
        assistanceListings={
          opportunityData.opportunity_assistance_listings || []
        }
      />
      <p className="margin-top-2 margin-bottom-0 font-sans-2xs">
        <OpportunityHeaderStatusTag
          status={opportunityData.opportunity_status}
        />
        {t("lastUpdated")} {lastUpdated || "--"}
      </p>
    </div>
  );
};

export default OpportunityHeaderDetails;
