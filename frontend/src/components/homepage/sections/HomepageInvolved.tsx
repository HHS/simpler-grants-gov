import { ExternalRoutes } from "src/constants/routes";

import { useTranslations } from "next-intl";
import { Grid } from "@trussworks/react-uswds";

import HomePageSection from "src/components/homepage/homePageSection";
import IconInfo from "src/components/homepage/IconInfoSection";

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
            title={t("technicalTitle")}
          />
          <p>
            <a
              href={ExternalRoutes.FIDER}
              target="_blank"
              rel="noopener noreferrer"
              className="usa-link--external"
            >
              {t("fiderLink")}
            </a>
          </p>
          <p>
            <a
              href={ExternalRoutes.WIKI_CONTRIBUTE_CODE}
              target="_blank"
              rel="noopener noreferrer"
              className="usa-link--external"
            >
              {t("technicalLink")}
            </a>
          </p>
          <p>
            <a
              href={ExternalRoutes.FORUM}
              target="_blank"
              rel="noopener noreferrer"
              className="usa-link--external"
            >
              {t("discourseLink")}
            </a>
          </p>
        </Grid>
        <Grid col={6}>
          <IconInfo
            description={t("participateDescription")}
            iconName="chat"
            title={t("participateTitle")}
          />
          <p>
            <a
              href={ExternalRoutes.ETHNIO_VOLUNTEER}
              target="_blank"
              rel="noopener noreferrer"
              className="usa-link--external"
            >
              {t("participateLink")}
            </a>
          </p>
        </Grid>
      </Grid>
    </HomePageSection>
  );
};

export default InvolvedContent;
