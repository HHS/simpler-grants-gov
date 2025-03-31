import { useTranslations } from "next-intl";
import { Grid, GridContainer } from "@trussworks/react-uswds";

export default function VisionGetThere() {
  const t = useTranslations("Vision.get_there");

  return (
    <GridContainer className="grid-row">
      <h1 className="grid-col" data-testid="get-there-content">
        {t("title_1")}
      </h1>
      <Grid className="grid-col">
        <Grid className="grid-row grid-gap-1">
          <h2>{t("title_2")}</h2>
          <p>{t("content_1")}</p>
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
