import { useTranslations } from "next-intl";
import { Grid } from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";

const ResearchThemes = () => {
  const t = useTranslations("Research");

  return (
    <ContentLayout
      title={t("themes.title")}
      data-testid="research-themes-content"
      titleSize="m"
      bottomBorder="none"
    >
      <Grid>
        <p className="usa-intro">{t("themes.paragraph_1")}</p>
      </Grid>
      <Grid row gap="lg">
        <Grid tabletLg={{ col: 6 }}>
          <h3 className="tablet-lg:font-sans-lg">{t("themes.title_2")}</h3>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {t("themes.paragraph_2")}
          </p>
        </Grid>
        <Grid tabletLg={{ col: 6 }}>
          <h3 className="tablet-lg:font-sans-lg">{t("themes.title_3")}</h3>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {t("themes.paragraph_3")}
          </p>
        </Grid>
      </Grid>
      <Grid row gap="lg">
        <Grid tabletLg={{ col: 6 }}>
          <h3 className="tablet-lg:font-sans-lg">{t("themes.title_4")}</h3>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {t("themes.paragraph_4")}
          </p>
        </Grid>
        <Grid tabletLg={{ col: 6 }}>
          <h3 className="tablet-lg:font-sans-lg">{t("themes.title_5")}</h3>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {t("themes.paragraph_5")}
          </p>
        </Grid>
      </Grid>
    </ContentLayout>
  );
};

export default ResearchThemes;
