import {
  Opportunity,
  OpportunityAssistanceListing,
} from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";

import ContentLayout from "src/components/ContentLayout";

type Props = {
  opportunityData: Opportunity;
};

const OpportunityIntro = ({ opportunityData }: Props) => {
  const t = useTranslations("OpportunityListing.intro");

  const agencyName =
    opportunityData.summary.agency_name === ""
      ? "--"
      : opportunityData.summary.agency_name;

  const assistanceListings = ({
    opportunity_assistance_listings,
  }: {
    opportunity_assistance_listings: OpportunityAssistanceListing[];
  }) => {
    if (opportunity_assistance_listings.length === 0)
      return (
        <p className="tablet-lg:font-sans-2xs">{`${t("assistanceListings")} --`}</p>
      );

    return opportunity_assistance_listings.map((listing, index) => (
      <p className="tablet-lg:font-sans-2xs" key={index}>
        {index === 0 && `${t("assistanceListings")}`}
        {listing.assistance_listing_number}
        {" -- "}
        {listing.program_title}
      </p>
    ));
  };

  const lastUpdated = (updated_at: string) => {
    if (updated_at === "") return `${t("lastUpdated")} --`;
    else {
      const date = new Date(updated_at);
      const formattedDate = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);

      return `${t("lastUpdated")} ${formattedDate}`;
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
        {assistanceListings({
          opportunity_assistance_listings:
            opportunityData.opportunity_assistance_listings,
        })}
        <p className="tablet-lg:font-sans-2xs">
          {lastUpdated(opportunityData.updated_at)}
        </p>
      </div>
    </ContentLayout>
  );
};

export default OpportunityIntro;
