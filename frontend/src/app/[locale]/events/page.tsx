import { useTranslations } from "next-intl";

import {
  Grid,
  GridContainer,
} from "@trussworks/react-uswds";

import Hero from "./Hero";
import Upcoming from "./Upcoming";

export default function Events() {
  const t = useTranslations("Events");
  return (
    <>
      <Hero />
      <Upcoming />
      <div className="bg-base-lightest">
        <GridContainer>
          <Grid row>
            <Grid tablet={{
              col: true
            }}>
            </Grid>
            <Grid>
              {t("demos.title")}
            </Grid>
            <Grid>
              <p>
                {t("demos.description")}
              </p>
            </Grid>
          </Grid>
          <Grid row>
            <Grid>
              {t("coding_challenge.title")}
            </Grid>
            <Grid>
              <p>
                {t("coding_challenge.description")}
              </p>
            </Grid>
            <Grid>
              <p>
                {t("coding_challenge.link")}
              </p>
            </Grid>
          </Grid>
        </GridContainer>
      </div>
    </>
  );
}
