import { ExternalRoutes } from "src/constants/routes";

import { useTranslations } from "next-intl";
import { Grid } from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";

const ProcessInvolved = () => {
  const t = useTranslations("Process");

  const email = ExternalRoutes.EMAIL_SIMPLERGRANTSGOV;
  const para1 = t.rich("involved.paragraph_1", {
    email: (chunks) => (
      <a href={`mailto:${email}`} target="_blank" rel="noopener noreferrer">
        {chunks}
      </a>
    ),
    strong: (chunks) => <strong> {chunks} </strong>,
  });
  const para2 = t.rich("involved.paragraph_2", {
    github: (chunks) => (
      <a
        className="usa-link--external"
        target="_blank"
        rel="noopener noreferrer"
        href={ExternalRoutes.GITHUB_REPO}
      >
        {chunks}
      </a>
    ),
    wiki: (chunks) => (
      <a
        className="usa-link--external"
        target="_blank"
        rel="noopener noreferrer"
        href={ExternalRoutes.WIKI}
      >
        {chunks}
      </a>
    ),
    strong: (chunks) => <strong> {chunks} </strong>,
  });
  return (
    <ContentLayout data-testid="process-involved-content" bottomBorder="none">
      <Grid row gap="lg">
        <Grid tabletLg={{ col: 6 }}>
          <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
            {t("involved.title_1")}
          </h3>
          <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {para1}
          </p>
        </Grid>
        <Grid tabletLg={{ col: 6 }}>
          <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
            {t("involved.title_2")}
          </h3>
          <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {para2}
          </p>
        </Grid>
      </Grid>
    </ContentLayout>
  );
};

export default ProcessInvolved;
