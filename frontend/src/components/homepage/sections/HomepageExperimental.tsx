import { useTranslations } from "next-intl";
import { Button, Grid } from "@trussworks/react-uswds";

import HomePageSection from "src/components/homepage/homePageSection";
import IconInfo from "src/components/homepage/IconInfoSection";

const trySearchLink = "https://simpler.grants.gov/search";
const subscribeLink = "https://simpler.grants.gov/subscribe";

const ExperimentalContent = () => {
  const t = useTranslations("Experimental");

  return (
    <HomePageSection
      className="bg-base-lightest"
      data-testid="homepage-experimental"
      title={t("title")}
    >
      <h2>{t("header")}</h2>
      <h3>{t("subheader1")}</h3>
      <p className="font-sans-md line-height-sans-4">{t("content1")}</p>
      <a href={trySearchLink} target="_blank" rel="noopener noreferrer">
        <Button
          className="margin-y-2 usa-button--secondary"
          type="button"
          size="big"
        >
          {t("tryLink")}
        </Button>
      </a>
      <h3>{t("subheader2")}</h3>
      <p className="font-sans-md line-height-sans-4">{t("content2")}</p>
      <Grid row className="padding-y-2" gap="md">
        <Grid col={6}>
          <IconInfo
            description={t("feedbackDescription")}
            iconName="build"
            link="mailto:simpler@grants.gov"
            linkText={t("feedbackLink")}
            title={t("feedbackTitle")}
          />
        </Grid>
        <Grid col={6}>
          <IconInfo
            description={t("newFeaturesDescription")}
            iconName="mail"
            link={subscribeLink}
            linkText={t("newFeaturesLink")}
            title={t("newFeaturesTitle")}
          />
        </Grid>
      </Grid>
    </HomePageSection>
  );
};

export default ExperimentalContent;
