import { useTranslation } from "next-i18next";
import { Grid, GridContainer } from "@trussworks/react-uswds";

const GoalContent = () => {
  const { t } = useTranslation("common", { keyPrefix: "Index" });

  return (
    <GridContainer>
      <Grid row>
        <h2 className="margin-bottom-0">{t("goal_title")}</h2>
      </Grid>
      <Grid row gap="md">
        <Grid tablet={{ col: 6 }}>
          <p className="usa-intro">{t("goal_paragraph_1")}</p>
        </Grid>
        <Grid tablet={{ col: 6 }}>
          <h3>{t("goal_title_2")}</h3>
          <p>{t("goal_paragraph_2")}</p>
          <h3>{t("goal_title_3")}</h3>
          <p>{t("goal_paragraph_3")}</p>
        </Grid>
      </Grid>
    </GridContainer>
  );
};

export default GoalContent;
