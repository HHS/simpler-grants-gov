import { ExternalRoutes } from "src/constants/routes";

import { Trans, useTranslation } from "next-i18next";
import { Grid } from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";

const ProcessInvolved = () => {
  const { t } = useTranslation("common", { keyPrefix: "Process" });

  const email = ExternalRoutes.EMAIL_SIMPLERGRANTSGOV;

  return (
    <ContentLayout data-testid="process-involved-content" bottomBorder="none">
      <Grid row gap="lg">
        <Grid tabletLg={{ col: 6 }}>
          <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
            {t("involved.title_1")}
          </h3>
          <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            <Trans
              t={t}
              i18nKey={"involved.paragraph_1"}
              components={{
                email: (
                  <a
                    href={`mailto:${email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
              }}
            />
          </p>
        </Grid>
        <Grid tabletLg={{ col: 6 }}>
          <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
            {t("involved.title_2")}
          </h3>
          <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            <Trans
              t={t}
              i18nKey={"involved.paragraph_2"}
              components={{
                github: (
                  <a
                    className="usa-link--external"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={ExternalRoutes.GITHUB_REPO}
                  />
                ),
              }}
            />
          </p>
        </Grid>
      </Grid>
    </ContentLayout>
  );
};

export default ProcessInvolved;
