import { useTranslation, Trans } from "next-i18next";
import { Grid } from "@trussworks/react-uswds";
import ContentLayout from "src/components/ContentLayout";
import { ExternalRoutes } from "src/constants/routes";

const IndexProcessContent = () => {
    const { t } = useTranslation("common", { keyPrefix: "Index" });

  return (
    <ContentLayout title={t("process.title")} data-testid="process-content">
        <Grid tabletLg={{ col: 6 }}>
          <p className="usa-intro">{t("process.paragraph_1")}</p>
        </Grid>
        <Grid tabletLg={{ col: 6 }}>
            <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
            {t("process.title_2")}
            </h3>
          <Trans
            t={t}
            i18nKey="process.list"
            components={{
              ul: (
                <ul className="usa-list margin-top-0 tablet-lg:margin-top-3 font-sans-md line-height-sans-4" />
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
  )
};

export default IndexProcessContent;