import { ExternalRoutes } from "src/constants/routes";

import { Trans, useTranslation } from "next-i18next";
import { Grid, GridContainer, Icon } from "@trussworks/react-uswds";

const WtGIContent = () => {
  const email = ExternalRoutes.EMAIL_EQUITYINGRANTS;
  const { t } = useTranslation("common", { keyPrefix: "Index" });

  return (
    <GridContainer
      className="padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-6"
      data-testid="wtgi-content"
    >
      <h2 className="margin-bottom-0 tablet-lg:font-sans-xl desktop-lg:font-sans-2xl">
        {t("wtgi_title")}
      </h2>
      <Grid row gap>
        <Grid tabletLg={{ col: 6 }}>
          <p className="usa-intro">{t("wtgi_paragraph_1")}</p>
        </Grid>
        <Grid tabletLg={{ col: 6 }}>
          <h3 className="margin-bottom-0-- desktop-lg:font-sans-lg">
            <strong>
              Join our open‑source community on{" "}
              <span className="text-no-wrap">
                GitHub <Icon.Github size={3} aria-label="Github" />
              </span>
            </strong>
          </h3>
          <Trans
            t={t}
            i18nKey="wtgi_list"
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
            }}
          />
          <p className="margin-top-3 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            <Trans
              t={t}
              i18nKey="wtgi_paragraph_2"
              values={{ email }}
              components={{
                email: <a href={`mailto:${email}`} />,
              }}
            />
          </p>
        </Grid>
      </Grid>
    </GridContainer>
  );
};

export default WtGIContent;
