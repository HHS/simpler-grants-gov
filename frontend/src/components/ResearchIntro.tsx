import { useTranslation } from "next-i18next";
import { Grid, GridContainer } from "@trussworks/react-uswds";

const ResearchIntro = () => {
  const { t } = useTranslation("common", { keyPrefix: "Research" });

  return (
    <GridContainer className="padding-bottom-5 tablet:padding-top-0 desktop-lg:padding-top-0 border-bottom-2px border-base-lightest">
      <h1 className="margin-0 tablet-lg:font-sans-xl desktop-lg:font-sans-2xl">
        {t("intro_title")}
      </h1>
      <Grid row gap>
        <Grid
          tabletLg={{ col: 12 }}
          desktop={{ col: 12 }}
          desktopLg={{ col: 12 }}
        >
          <p className="tablet-lg:font-sans-xl line-height-sans-3 usa-intro margin-top-2">
            {t("intro_content")}
          </p>
        </Grid>
      </Grid>
    </GridContainer>
  );
};

export default ResearchIntro;
