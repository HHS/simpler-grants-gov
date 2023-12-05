import { ExternalRoutes } from "src/constants/routes";

import { Trans, useTranslation } from "next-i18next";
import Link from "next/link";
import { Button, Grid, Icon } from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";

const IndexProcessContent = () => {
  const { t } = useTranslation("common", { keyPrefix: "Index" });

  return (
    <ContentLayout title={t("process.title")} data-testid="process-content">
      <Grid tabletLg={{ col: 6 }}>
        <p className="usa-intro">{t("process.paragraph_1")}</p>
        <Link href="/process" passHref>
          <Button className="margin-bottom-4" type="button" size="big">
            {t("process.cta")}{" "}
            <Icon.ArrowForward
              className="text-middle"
              size={4}
              aria-label="arrow forward"
            />
          </Button>
        </Link>
      </Grid>
      <Grid tabletLg={{ col: 6 }}>
        <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
          {t("process.title_2")}
        </h3>
        <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
          {t("process.paragraph_2")}
        </p>
        <Trans
          t={t}
          i18nKey="process.list"
          components={{
            ul: (
              <ul className="usa-list margin-top-0 tablet-lg:margin-top-3 font-sans-md line-height-sans-4 margin-bottom-2" />
            ),
            li: <li />,
            small: <small />,
            repo: (
              <a
                className="usa-link--external"
                target="_blank"
                rel="noopener noreferrer"
                href={ExternalRoutes.GITHUB_REPO}
              />
            ),
            goals: (
              <a
                className="usa-link--external"
                target="_blank"
                rel="noopener noreferrer"
                href={ExternalRoutes.GITHUB_REPO_GOALS}
              />
            ),
            roadmap: (
              <a
                className="usa-link--external"
                target="_blank"
                rel="noopener noreferrer"
                href={ExternalRoutes.GITHUB_REPO_ROADMAP}
              />
            ),
            contribute: (
              <a
                className="usa-link--external"
                target="_blank"
                rel="noopener noreferrer"
                href={ExternalRoutes.GITHUB_REPO_CONTRIBUTING}
              />
            ),
            adr: (
              <a
                className="usa-link--external"
                target="_blank"
                rel="noopener noreferrer"
                href={ExternalRoutes.GITHUB_ADR}
              />
            ),
          }}
        />
      </Grid>
    </ContentLayout>
  );
};

export default IndexProcessContent;
