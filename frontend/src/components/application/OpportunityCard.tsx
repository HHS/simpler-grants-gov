import { useTranslations } from "next-intl";
import { Grid, GridContainer, Link } from "@trussworks/react-uswds";
import { OpportunityAssistanceListing, OpportunityOverview as OpportunityOverviewType } from "src/types/opportunity/opportunityResponseTypes";
import { formatCurrency } from "src/utils/formatCurrencyUtil";

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
    opportunity_title,
    opportunity_id,
    opportunity_number,
    post_date,
    agency_name,
    opportunity_assistance_listings,
    is_cost_sharing,
    agency_code,
    agency_email_address,
    agency_phone_number,
    estimated_total_program_funding,
    expected_number_of_awards,
    award_ceiling,
    award_floor,
    close_date
  } = props.overview;
  const t = useTranslations("Application.opportunityOverview");

  const opportunityAssistanceListings = (opportunityAssistanceListings: OpportunityAssistanceListing[]) => {
    const listings: string[] = []

    opportunityAssistanceListings.map((opportunityAssistanceListing) => {
      const { assistance_listing_number, program_title } = opportunityAssistanceListing
      listings.push(`${assistance_listing_number} -- ${program_title}`

      )})

    return listings.length ? listings.join(', ') : null;
  }

  const isCostSharing = (is_cost_sharing: boolean | null) => {
    if (is_cost_sharing != null) {
      return is_cost_sharing ? 'Yes' : 'No'
    }

    return null
  }

  const grantorContactInformation = (name: string | null, email: string | null, phone: string | null) => {
    const contactInformation = []

    if (name != null) contactInformation.push(name)
    if (email != null) contactInformation.push(email)
    if (phone != null) contactInformation.push(phone)

    return contactInformation.length ? contactInformation.join(', ') : null
  }

  const agency = (agencyName: string | null, agencyCode: string | null) => {
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

  return (
    <>
      <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
        <dl className="margin-top-0">
          <OpportunityItemLink opKey={t("name")} opValue={opportunity_title} opId={opportunity_id} />
          <OpportunityItem opKey={t("number")} opValue={opportunity_number} />
          <OpportunityItem opKey={t("posted")} opValue={post_date} />
          <OpportunityItem opKey={t("agency")} opValue={agency(agency_name, agency_code)} />
          <OpportunityItem
            opKey={t("assistanceListings")}
            opValue={opportunityAssistanceListings(opportunity_assistance_listings)}
          />
          <OpportunityItem
            opKey={t("costSharingOrMatchingRequirement")}
            opValue={isCostSharing(is_cost_sharing)}
          />
          <OpportunityItem
            opKey={t("grantorContactInfomation")}
            opValue={grantorContactInformation(agency_name, agency_email_address, agency_phone_number)}
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
            opValue={close_date}
          />
        </dl>
      </Grid>
    </>
  );
};

export const OpportunityCard = () => {
  const t = useTranslations("Application.opportunityOverview");
  const opportunityOverview = {
    opportunity_title: 'The opportunity title',
    opportunity_id: 2342,
    opportunity_number: 'adf33a',
    post_date: 'May 22, 2025',
    close_date: 'May 22, 2027',
    agency_name: 'Administration for Children and Families',
    opportunity_assistance_listings: [
      {
        assistance_listing_number: '0',
        program_title: 'title'
      },
      {
        assistance_listing_number: '1',
        program_title: 'title 2'
      },
    ],
    is_cost_sharing: false,
    agency_code: 'ACYF/CB',
    agency_email_address: 'something@email.com',
    agency_phone_number: '7703120099',
    estimated_total_program_funding: 1400,
    expected_number_of_awards: 14,
    award_ceiling: 100,
    award_floor: 1
  };

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
