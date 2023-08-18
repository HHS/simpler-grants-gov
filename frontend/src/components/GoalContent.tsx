import { useTranslation } from "next-i18next";
import { Grid, GridContainer } from "@trussworks/react-uswds";

const GoalContent = () => {
  const { t } = useTranslation("common", { keyPrefix: "Index" });

  return (
    <GridContainer className="desktop:padding-y-4 tablet:padding-y-2 padding-y-1">
      <Grid row>
        <h2 className="margin-bottom-0 tablet:font-sans-xl">{t("goal_title")}</h2>
      </Grid>
      <Grid row gap="lg">
        <Grid tablet={{ col: 6 }}>
          <p className="usa-intro">{t("goal_paragraph_1")}</p>
        </Grid>
        <Grid tablet={{ col: 6 }}>
          <h3 className="tablet:font-sans-lg">{t("goal_title_2")}</h3>
          <p className="tablet:margin-bottom-3 line-height-sans-4">{t("goal_paragraph_2")}</p>
          <h3 className="tablet:font-sans-lg">{t("goal_title_3")}</h3>
          <p className="line-height-sans-4">{t("goal_paragraph_3")}</p>
        </Grid>
      </Grid>
    </GridContainer>
  );
};

export default GoalContent;
