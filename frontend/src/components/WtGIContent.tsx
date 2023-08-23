import { ExternalRoutes } from "src/constants/routes";

import { Trans, useTranslation } from "next-i18next";
import { Grid, GridContainer } from "@trussworks/react-uswds";

const WtGIContent = () => {
  const { t } = useTranslation("common", { keyPrefix: "Index" });

  return (
    <GridContainer
      className="desktop:padding-y-4 tablet:padding-y-2 padding-y-1"
      data-testid="wtgi-content"
    >
      <Grid row>
        <h2 className="margin-bottom-0 tablet:font-sans-xl">
          {t("wtgi_title")}
        </h2>
      </Grid>
      <Grid row gap="lg">
        <Grid tablet={{ col: 6 }}>
          <p className="usa-intro">{t("wtgi_paragraph_1")}</p>
        </Grid>
        <Grid tablet={{ col: 6 }}>
          <Trans
            t={t}
            i18nKey="wtgi_list"
            components={{
              ul: <ul className="usa-list" />,
              li: <li className="line-height-sans-4" />,
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
