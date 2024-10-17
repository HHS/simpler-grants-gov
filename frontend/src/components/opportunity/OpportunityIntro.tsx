import {
  Opportunity,
  OpportunityAssistanceListing,
} from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";

import ContentLayout from "src/components/ContentLayout";

type Props = {
  opportunityData: Opportunity;
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
    if (!timestamp) return `${t("last_updated")} --`;
    else {
      const date = new Date(timestamp);
      const formattedDate = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);

      return `${t("last_updated")} ${formattedDate}`;
    }
  };

  return (
    <ContentLayout
      title={opportunityData.opportunity_title}
      data-testid="opportunity-intro-content"
      paddingTop={false}
    >
      <div className="usa-prose">
        <p className="usa-intro line-height-sans-5 tablet-lg:font-sans-lg">{`${t("agency")} ${agencyName}`}</p>
        <AssistanceListingsDisplay
          assistanceListings={opportunityData.opportunity_assistance_listings}
          assistanceListingsText={t("assistance_listings")}
        />
        <p className="tablet-lg:font-sans-2xs">
          {lastUpdated(opportunityData.updated_at)}
        </p>
      </div>
    </ContentLayout>
  );
};

export default OpportunityIntro;
