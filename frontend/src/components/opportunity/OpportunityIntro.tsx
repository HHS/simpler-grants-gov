import {
  OpportunityAssistanceListing,
  OpportunityDetail,
} from "src/types/opportunity/opportunityResponseTypes";
import { legacyOpportunityUrl } from "src/utils/opportunity/opportunityUtils";

import { useTranslations } from "next-intl";

import { USWDSIcon } from "src/components/USWDSIcon";

type Props = {
  opportunityData: OpportunityDetail;
};

const AssistanceListingsDisplay = ({
  assistanceListings,
  assistanceListingsText,
}: {
  assistanceListings: OpportunityAssistanceListing[];
  assistanceListingsText: string;
}) => {
  if (!assistanceListings.length) {
    // note that the dash here is an em dash, not just a regular dash
    return (
      <p className="tablet-lg:font-sans-2xs">{`${assistanceListingsText} —`}</p>
    );
  }

  return assistanceListings.map((listing, index) => (
    <p className="tablet-lg:font-sans-2xs" key={index}>
      {index === 0 && `${assistanceListingsText}`}
      {listing.assistance_listing_number}
      {" -- "}
      {listing.program_title}
    </p>
  ));
};

const OpportunityIntro = ({ opportunityData }: Props) => {
  const t = useTranslations("OpportunityListing.intro");

  const agencyName = opportunityData.agency_name || "--";

  const lastUpdated = (timestamp: string) => {
    if (!timestamp) return `${t("lastUpdated")} --`;
    else {
      const date = new Date(timestamp);
      const formattedDate = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);

      return `${t("lastUpdated")} ${formattedDate}`;
    }
  };

  return (
    <>
      <p className="usa-intro line-height-sans-5 tablet-lg:font-sans-lg margin-top-0">{`${t("agency")} ${agencyName}`}</p>
      <AssistanceListingsDisplay
        assistanceListings={opportunityData.opportunity_assistance_listings}
        assistanceListingsText={t("assistanceListings")}
      />
      <div className="tablet-lg:font-sans-2xs display-flex tablet:flex-row flex-column">
        <div className="flex-2">{lastUpdated(opportunityData.updated_at)}</div>
        <div className="flex-3">
          <a
            className="usa-button usa-button--unstyled"
            href={legacyOpportunityUrl(opportunityData.legacy_opportunity_id)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("versionHistory")}
            <USWDSIcon name="launch" />
          </a>
        </div>
      </div>
    </>
  );
};

export default OpportunityIntro;
