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
          <Grid className="grid-row flex-align-center flex-justify-center">
            <USWDSIcon name="search" height="50px" className="grid-col-1" />
            <h3 className="grid-col-2">{t("title_2")}</h3>
            <p className="grid-col-fill">{t("paragraph_2")}</p>
          </Grid>
          <Grid className="grid-row flex-align-center flex-justify-center">
            <USWDSIcon
              name="upload_file"
              height="50px"
              className="grid-col-1"
            />
            <h3 className="grid-col-2">{t("title_3")}</h3>
            <p className="grid-col-fill">{t("paragraph_3")}</p>
          </Grid>
          <Grid className="grid-row flex-align-center flex-justify-center">
            <USWDSIcon
              name="trending_up"
              height="50px"
              className="grid-col-1"
            />
            <h3 className="grid-col-2">{t("title_4")}</h3>
            <p className="grid-col-fill">{t("paragraph_4")}</p>
          </Grid>
        </Grid>
      </Grid>
    </GridContainer>
  );
}
