import { useTranslations } from "next-intl";
import { Grid } from "@trussworks/react-uswds";

import HomePageSection from "src/components/homepage/homePageSection";
import IconInfo from "src/components/homepage/IconInfoSection";

const codeLink = "https://wiki.simpler.grants.gov/get-involved/github-code";
const discourseLink = "https://forum.simpler.grants.gov/";
const participateLink = "https://ethn.io/91822";

const InvolvedContent = () => {
  const t = useTranslations("Homepage.sections.involved");

  return (
    <HomePageSection
      className="padding-y-6 bg-base-lightest"
      title={t("title")}
    >
      <Grid
        row
        className="padding-y-2"
        data-testid="homepage-involved"
        gap="md"
      >
        <Grid col={6}>
          <IconInfo
            description={t("technicalDescription")}
            iconName="code"
            link={codeLink}
            linkText={t("technicalLink")}
            title={t("technicalTitle")}
          />
          <p>
            <a href={discourseLink} target="_blank" rel="noopener noreferrer">
              {t("discourseLink")}
            </a>
          </p>
        </Grid>
        <Grid col={6}>
          <IconInfo
            description={t("participateDescription")}
            iconName="chat"
            link={participateLink}
            linkText={t("participateLink")}
            title={t("participateTitle")}
          />
        </Grid>
      </Grid>
    </HomePageSection>
  );
};

export default InvolvedContent;
