import { useTranslations } from "next-intl";
import { Grid, GridContainer } from "@trussworks/react-uswds";

export default function VisionGoals() {
  const t = useTranslations("Vision.goals");

  return (
    <div className="padding-4 bg-base-lightest">
      <GridContainer className="grid-row">
        <h1 className="grid-col font-sans-2xl">{t("title_1")}</h1>
        <Grid className="grid-col">
          <Grid className="grid-row">
            <Grid className="grid-col padding-right-2">
              <h2>{t("title_2")}</h2>
              <p>{t("paragraph_1")}</p>
            </Grid>
            <Grid className="grid-col">
              <h3>{t("title_3")}</h3>
              <p>{t("paragraph_2")}</p>
            </Grid>
          </Grid>

          <Grid className="grid-row">
            <Grid className="grid-col padding-right-2">
              <h2>{t("title_4")}</h2>
              <p>{t("paragraph_3")}</p>
            </Grid>
            <Grid className="grid-col">
              <h2>{t("title_5")}</h2>
              <p>{t("paragraph_4")}</p>
            </Grid>
          </Grid>
        </Grid>
      </GridContainer>
    </div>
  );
}
