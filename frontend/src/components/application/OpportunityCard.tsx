import { useTranslations } from "next-intl";
import { Grid, GridContainer, Link } from "@trussworks/react-uswds";
import { OpportunityAssistanceListing, OpportunityOverview as OpportunityOverviewType } from "src/types/opportunity/opportunityResponseTypes";
import { formatCurrency } from "src/utils/formatCurrencyUtil";
import { getConfiguredDayJs } from "src/utils/dateUtil";

type OpportunityOverviewProps = {
  overview: OpportunityOverviewType;
};

const OpportunityItem = ({
  opKey,
  opValue,
}: {
  opKey: string;
  opValue?: string | null;
}) => {
  return (
    <div>
      <dt className="margin-right-1 text-bold">{opKey}:</dt>
      <dd>{opValue ?? "--"}</dd>
    </div>
  );
};


const OpportunityItemLink = ({
  opKey,
  opValue,
  opId
}: {
  opKey: string;
  opValue: string | null;
  opId: number
}) => {
  return (
    <div>
      <dt className="margin-right-1 text-bold">{opKey}:</dt>
      <dd>
        <Link
          href={`/opportunity/${opId}`}
          className="usa-link usa-link"
          id={`application-page-opportunity-card-link`}
        >
          {opValue ?? '--'}
        </Link>
      </dd>
    </div>
  );
};

const OpportunityOverview = (props: OpportunityOverviewProps) => {
  const {
    agency_code,
    agency_contact_description,
    agency_name,
    award_ceiling,
    award_floor,
    close_date,
    estimated_total_program_funding,
    expected_number_of_awards,
    is_cost_sharing,
    post_date,
    opportunity_assistance_listings,
    opportunity_id,
    opportunity_title,
    opportunity_number,
  } = props.overview;
  const t = useTranslations("Application.opportunityOverview");

  const displayOpportunityAssistanceListings = (opportunityAssistanceListings: OpportunityAssistanceListing[]) => {
    const listings: string[] = []

    opportunityAssistanceListings.forEach((opportunityAssistanceListing) => {
      const { assistance_listing_number, program_title } = opportunityAssistanceListing
      listings.push(`${assistance_listing_number} -- ${program_title}`
      )
    })

    return listings.length ? listings.join(', ') : null;
  }

  const displayIsCostSharing = (isCostSharing: boolean | null) => {
    if (isCostSharing != null) {
      return isCostSharing ? 'Yes' : 'No'
    }

    return null
  }

  const displayAgencyAndCode = (agencyName: string | null, agencyCode: string | null) => {
    let agencyTitle = null

    if(agencyName) {
      agencyTitle = agencyName
    }

    if(agencyCode && agencyTitle) {
      agencyTitle = `${agencyTitle} - ${agencyCode}`
    } else {
      agencyTitle = agencyCode
    }

    return agencyTitle
  }

  const displayPostedDate = (postDate: string | null) => {
    if(postDate) {
      return getConfiguredDayJs()(postDate).format("MMM D, YYYY hh:mm A z")
    }
    return null
  }

  const displayEstimatedAwardDate = (estimatedAwardDate: string | null) => {
    if(estimatedAwardDate) {
      return getConfiguredDayJs()(estimatedAwardDate).format("MMM D, YYYY hh:mm A z")
    }
    return null
  }

  return (
    <>
      <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
        <dl className="margin-top-0">
          <OpportunityItemLink opKey={t("name")} opValue={opportunity_title} opId={opportunity_id} />
          <OpportunityItem opKey={t("number")} opValue={opportunity_number} />
          <OpportunityItem opKey={t("posted")} opValue={displayPostedDate(post_date)} />
          <OpportunityItem opKey={t("agency")} opValue={displayAgencyAndCode(agency_name, agency_code)} />
          <OpportunityItem
            opKey={t("assistanceListings")}
            opValue={displayOpportunityAssistanceListings(opportunity_assistance_listings)}
          />
          <OpportunityItem
            opKey={t("costSharingOrMatchingRequirement")}
            opValue={displayIsCostSharing(is_cost_sharing)}
          />
          <OpportunityItem
            opKey={t("grantorContactInfomation")}
            opValue={agency_contact_description}
          />
        </dl>
      </Grid>
      <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
        <h4 className="font-ui-md text-bold">{t("award")}</h4>
        <dl className="margin-top-0">
          <OpportunityItem
            opKey={t("programFunding")}
            opValue={formatCurrency(estimated_total_program_funding)}
          />
          <OpportunityItem opKey={t("expectedAward")} opValue={expected_number_of_awards ? String(expected_number_of_awards) : null} />
          <OpportunityItem opKey={t("awardMaximum")} opValue={formatCurrency(award_ceiling)} />
          <OpportunityItem opKey={t("awardMinimum")} opValue={formatCurrency(award_floor)} />
          <OpportunityItem
            opKey={t("estimatedAwardDate")}
            opValue={displayEstimatedAwardDate(close_date)}
          />
        </dl>
      </Grid>
    </>
  );
};

export const OpportunityCard = ( opportunityOverview: OpportunityOverviewType ) => {
  const t = useTranslations("Application.opportunityOverview");

  return (
    <GridContainer
      data-testid="oppotunity-card"
      className="padding-x-2 border border-gray-10"
    >
      <h3 className="margin-top-2">{t("opportunity")}</h3>
      <Grid row>
        <OpportunityOverview overview={opportunityOverview} />
      </Grid>
    </GridContainer>
  );
};
