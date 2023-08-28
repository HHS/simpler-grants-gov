import { ExternalRoutes } from "src/constants/routes";

import { Trans, useTranslation } from "next-i18next";
import { Grid, GridContainer } from "@trussworks/react-uswds";

const WtGIContent = () => {
  const { t } = useTranslation("common", { keyPrefix: "Index" });

  return (
    <GridContainer
      className="padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-6"
      data-testid="wtgi-content"
    >
      <h2 className="margin-bottom-0 tablet:font-sans-xl">{t("wtgi_title")}</h2>
      <Grid row gap>
        <Grid tabletLg={{ col: 6 }}>
          <p className="usa-intro">{t("wtgi_paragraph_1")}</p>
        </Grid>
        <Grid tabletLg={{ col: 6 }}>
          <Trans
            t={t}
            i18nKey="wtgi_list"
            components={{
              ul: (
                <ul className="usa-list margin-top-0 tablet-lg:margin-top-3 font-sans-md line-height-sans-4" />
              ),
              li: <li />,
              LinkToGoals: (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={ExternalRoutes.MILESTONES}
                />
              ),
              github: (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={ExternalRoutes.GITHUB_REPO}
                />
              ),
              email: <a href={ExternalRoutes.CONTACT_EMAIL} />,
            }}
          />
        </Grid>
      </Grid>
    </GridContainer>
  );
};

export default WtGIContent;
