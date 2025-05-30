import { Grid, GridContainer } from "@trussworks/react-uswds";
import { useTranslations } from "next-intl";
import { OpportunityOverview } from "./OpportunityOverview";
import { OpportunityAwardOverview } from "./OpportunityAwardOverview";

export const OpportunityCard = () => {
  const t = useTranslations("Application.opportunityOverview");
  const opportunityOverview = {}
  const opportunityAwardOverview = {}

  return (
    <GridContainer
      data-testid="oppotunity-card"
      className="padding-x-2 border border-gray-10"
    >
      <h3 className="margin-top-2">{t('opportunity')}</h3>
      <Grid row>
        <OpportunityOverview overview={opportunityOverview} />
        <OpportunityAwardOverview awardOverview={opportunityAwardOverview} />
      </Grid>
    </GridContainer>
  );
};
