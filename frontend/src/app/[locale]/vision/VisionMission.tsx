import { useTranslations } from "next-intl";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

export default function VisionMssion() {
  const t = useTranslations("Vision.mission");

  return (
    <GridContainer className="padding-4 grid-row">
      <Grid className="grid-col">
        <h1>{t("title_1")}</h1>
      </Grid>
      <Grid className="grid-col">
        <Grid className="grid-row">
          <p>{t("paragraph_1")}</p>
          <Grid className="grid-row">
            <USWDSIcon name="trending_up" />
            <h3 className="grid-col-1">{t("title_2")}</h3>
            <p className="grid-col-fill padding-left-4">{t("paragraph_2")}</p>
          </Grid>
          <Grid className="grid-row">
            <USWDSIcon name="trending_up" />
            <h3 className="grid-col-1">{t("title_3")}</h3>
            <p className="grid-col-fill padding-left-4">{t("paragraph_3")}</p>
          </Grid>
          <Grid className="grid-row">
            <USWDSIcon name="trending_up" />
            <h3 className="grid-col-1">{t("title_4")}</h3>
            <p className="grid-col-fill padding-left-4">{t("paragraph_4")}</p>
          </Grid>
        </Grid>
      </Grid>
    </GridContainer>
  );
}
