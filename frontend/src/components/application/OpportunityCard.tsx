import {
  OpportunityAssistanceListing,
  OpportunityOverview as OpportunityOverviewType,
} from "src/types/opportunity/opportunityResponseTypes";
import { getConfiguredDayJs } from "src/utils/dateUtil";
import { formatCurrency } from "src/utils/formatCurrencyUtil";

import { useTranslations } from "next-intl";
import { Grid, GridContainer, Link } from "@trussworks/react-uswds";

type OpportunityOverviewProps = { opportunity: OpportunityOverviewType };

const OpportunityItem = ({
  opKey,
  opValue,
}: {
  opKey: string;
  opValue?: string | null;
}) => {
  return (
    <div className="margin-bottom-1">
      <dt className="margin-right-1 text-bold">{opKey}:</dt>
      <dd>{opValue ?? "--"}</dd>
    </div>
  );
};

const OpportunityItemLink = ({
  opKey,
  opValue,
  opId,
}: {
  opKey: string;
  opValue: string | null;
  opId: string;
}) => {
  return (
    <div className="margin-bottom-1">
      <dt className="margin-right-1 text-bold">{opKey}:</dt>
      <dd>
        <Link
          href={`/opportunity/${opId}`}
          className="usa-link usa-link"
          id={`application-page-opportunity-card-link`}
        >
          {opValue ?? "--"}
        </Link>
      </dd>
    </div>
  );
};

const displayOpportunityAssistanceListings = (
  opportunityAssistanceListings: OpportunityAssistanceListing[],
) => {
  const listings: void[] | string[] = opportunityAssistanceListings.map(
    (opportunityAssistanceListing) => {
      const { assistance_listing_number, program_title } =
        opportunityAssistanceListing;
      return `${assistance_listing_number} -- ${program_title}`;
    },
  );

  return listings.length ? listings.join(", ") : null;
};

const displayIsCostSharing = (isCostSharing: boolean | null) => {
  if (isCostSharing !== null) {
    return isCostSharing ? "Yes" : "No";
  }

  return null;
};

const displayAgencyAndCode = (
  agencyName: string | null,
  agencyCode: string | null,
) => (agencyCode && agencyName ? `${agencyName} - ${agencyCode}` : null);

const displayDate = (date: string | null) =>
  date ? getConfiguredDayJs()(date).format("MMM D, YYYY hh:mm A z") : null;

const OpportunityOverview = ({ opportunity }: OpportunityOverviewProps) => {
  const t = useTranslations("Application.opportunityOverview");
  const {
    agency_code,
    agency_name,
    opportunity_assistance_listings,
    opportunity_id,
    opportunity_title,
    opportunity_number,
    summary,
    opportunity_status,
  } = opportunity;

  return (
    <>
      <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
        <dl className="margin-top-0">
          <OpportunityItemLink
            opKey={t("name")}
            opValue={opportunity_title}
            opId={opportunity_id}
          />
          <OpportunityItem opKey={t("number")} opValue={opportunity_number} />
          <OpportunityItem
            opKey={
              opportunity_status === "forecasted"
                ? t("forecastDate")
                : t("posted")
            }
            opValue={displayDate(summary.post_date)}
          />
          <OpportunityItem
            opKey={t("agency")}
            opValue={displayAgencyAndCode(agency_name, agency_code)}
          />
          <OpportunityItem
            opKey={t("assistanceListings")}
            opValue={displayOpportunityAssistanceListings(
              opportunity_assistance_listings,
            )}
          />
          <OpportunityItem
            opKey={t("costSharingOrMatchingRequirement")}
            opValue={displayIsCostSharing(summary.is_cost_sharing)}
          />
          <OpportunityItem
            opKey={t("grantorContactInfomation")}
            opValue={summary.agency_contact_description}
          />
        </dl>
      </Grid>
      <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
        <h4 className="font-ui-md text-bold margin-bottom-1">{t("award")}</h4>
        <dl className="margin-top-0">
          <OpportunityItem
            opKey={t("programFunding")}
            opValue={formatCurrency(summary.estimated_total_program_funding)}
          />
          <OpportunityItem
            opKey={t("expectedAward")}
            opValue={
              summary.expected_number_of_awards
                ? String(summary.expected_number_of_awards)
                : null
            }
          />
          <OpportunityItem
            opKey={t("awardMaximum")}
            opValue={formatCurrency(summary.award_ceiling)}
          />
          <OpportunityItem
            opKey={t("awardMinimum")}
            opValue={formatCurrency(summary.award_floor)}
          />
          <OpportunityItem
            opKey={t("estimatedAwardDate")}
            opValue={displayDate(summary.close_date)}
          />
        </dl>
      </Grid>
    </>
  );
};

export const OpportunityCard = ({
  opportunityOverview,
}: {
  opportunityOverview: OpportunityOverviewType;
}) => {
  const t = useTranslations("Application.opportunityOverview");

  return (
    <GridContainer
      data-testid="opportunity-card"
      className="border radius-md border-base-lighter padding-x-2"
    >
      <h3 className="margin-top-2">{t("opportunity")}</h3>
      <Grid row gap>
        <OpportunityOverview opportunity={opportunityOverview} />
      </Grid>
    </GridContainer>
  );
};
