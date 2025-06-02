import { useTranslations } from "next-intl";
import { Grid, GridContainer } from "@trussworks/react-uswds";

interface OpportunityOverview {
  name?: string | null;
  number?: string | null;
  posted?: string | null;
  agency?: string | null;
  assistanceListings?: string | null;
  costSharingOrMatchingRequirement?: string | null;
  applicationInstruction?: string | null;
  grantorContactInfomation?: string | null;
  programFunding?: string | null;
  expectedAward?: string | null;
  awardMaximum?: string | null;
  awardMinimum?: string | null;
  estimatedAwardDate?: string | null;
  estimatedProjectStartDate?: string | null;
}

type OpportunityOverviewProps = {
  overview: OpportunityOverview;
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

const OpportunityOverview = (props: OpportunityOverviewProps) => {
  const {
    name,
    number,
    posted,
    agency,
    assistanceListings,
    costSharingOrMatchingRequirement,
    applicationInstruction,
    grantorContactInfomation,
    programFunding,
    expectedAward,
    awardMaximum,
    awardMinimum,
    estimatedAwardDate,
    estimatedProjectStartDate,
  } = props.overview;
  const t = useTranslations("Application.opportunityOverview");

  return (
    <>
      <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
        <dl className="margin-top-0">
          <OpportunityItem opKey={t("name")} opValue={name} />
          <OpportunityItem opKey={t("number")} opValue={number} />
          <OpportunityItem opKey={t("posted")} opValue={posted} />
          <OpportunityItem opKey={t("agency")} opValue={agency} />
          <OpportunityItem
            opKey={t("assistanceListings")}
            opValue={assistanceListings}
          />
          <OpportunityItem
            opKey={t("costSharingOrMatchingRequirement")}
            opValue={costSharingOrMatchingRequirement}
          />
          <OpportunityItem
            opKey={t("applicationInstruction")}
            opValue={applicationInstruction}
          />
          <OpportunityItem
            opKey={t("grantorContactInfomation")}
            opValue={grantorContactInfomation}
          />
        </dl>
      </Grid>
      <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
        <h4 className="font-ui-md text-bold">{t("award")}</h4>
        <dl className="margin-top-0">
          <OpportunityItem
            opKey={t("programFunding")}
            opValue={programFunding}
          />
          <OpportunityItem opKey={t("expectedAward")} opValue={expectedAward} />
          <OpportunityItem opKey={t("awardMaximum")} opValue={awardMaximum} />
          <OpportunityItem opKey={t("awardMinimum")} opValue={awardMinimum} />
          <OpportunityItem
            opKey={t("estimatedAwardDate")}
            opValue={estimatedAwardDate}
          />
          <OpportunityItem
            opKey={t("estimatedProjectStartDate")}
            opValue={estimatedProjectStartDate}
          />
        </dl>
      </Grid>
    </>
  );
};

export const OpportunityCard = () => {
  const t = useTranslations("Application.opportunityOverview");
  const opportunityOverview = {};

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
