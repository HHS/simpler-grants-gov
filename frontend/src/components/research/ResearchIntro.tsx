import { useTranslations } from "next-intl";
import { Grid, GridContainer } from "@trussworks/react-uswds";

const ResearchIntro = () => {
  const t = useTranslations("Research");

  return (
    <GridContainer className="grid-container padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-6 padding-top-0 tablet:padding-top-0 desktop-lg:padding-top-0 border-bottom-2px border-base-lighter">
      <h1 className="margin-bottom-0 tablet-lg:font-sans-xl desktop-lg:font-sans-2xl margin-top-0">
        {t("intro.title")}
      </h1>
      <Grid row gap>
        <p className="tablet-lg:font-sans-xl line-height-sans-3 usa-intro margin-top-2">
          {t("intro.content")}
        </p>
      </Grid>
    </GridContainer>
  );
};

export default ResearchIntro;
