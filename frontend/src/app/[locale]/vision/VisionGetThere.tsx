import { useTranslations } from "next-intl";
import { Grid, GridContainer } from "@trussworks/react-uswds";

export default function VisionGetThere() {
  const t = useTranslations("Vision.get_there");

  return (
    <GridContainer className="grid-row padding-4">
      <h1 className="grid-col font-sans-2xl" data-testid="get-there-content">
        {t("title_1")}
      </h1>
      <Grid className="grid-col padding-top-3">
        <Grid className="grid-row">
          <h2>{t("title_2")}</h2>
          <p className="font-sans-lg margin-bottom-neg-1">{t("paragraph_1")}</p>
          <p className="font-sans-lg">{t("paragraph_2")}</p>
        </Grid>
        <Grid className="grid-row grid-gap-4">
          <a
            className="padding-bottom-2"
            href="https://wiki.simpler.grants.gov/design-and-research/user-research/grants.gov-archetypes"
          >
            {t("link_text_1")}
          </a>
          <a href="https://ethn.io/91822">{t("link_text_2")}</a>
        </Grid>
      </Grid>
    </GridContainer>
  );
}
