import { ExternalRoutes } from "src/constants/routes";

import { useMessages, useTranslations } from "next-intl";
import { Grid } from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";
import { USWDSIcon } from "src/components/USWDSIcon";

const ResearchImpact = () => {
  const t = useTranslations("Research");

  const email = ExternalRoutes.EMAIL_SIMPLERGRANTSGOV;

  const messages = useMessages() as unknown as IntlMessages;
  const keys = Object.keys(messages.Research.impact.boxes);

  return (
    <ContentLayout
      title={t("impact.title")}
      data-testid="research-impact-content"
      titleSize="m"
      bottomBorder="none"
    >
      <Grid>
        <p className="usa-intro">{t("impact.paragraph_1")}</p>
        <p className="usa-intro text-bold margin-top-4">
          {t("impact.paragraph_2")}
        </p>
      </Grid>
      <Grid row gap="lg" className="margin-top-2">
        {keys.map((key) => {
          const title = t(`impact.boxes.${key}.title`);
          const content = t(`impact.boxes.${key}.content`);
          return (
            <Grid
              className="margin-bottom-6"
              key={title + "-key"}
              tabletLg={{ col: 4 }}
            >
              <div className="border radius-md border-base-lighter padding-x-205">
                <h3 className="tablet-lg:font-serif-lg">{title}</h3>
                <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
                  {content}
                </p>
              </div>
            </Grid>
          );
        })}
      </Grid>
      <Grid tabletLg={{ col: 8 }}>
        <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
          {t("impact.title_2")}
        </h3>
        <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
          {t.rich("impact.paragraph_3", {
            email: (chunks) => (
              <a
                href={`mailto:${email}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {chunks}
              </a>
            ),
            strong: (chunks) => <strong>{chunks}</strong>,
            subscribe: (chunks) => <a href={"/subscribe"}>{chunks}</a>,
            arrowUpRightFromSquare: () => (
              <USWDSIcon
                className="usa-icon text-middle"
                name="launch"
              ></USWDSIcon>
            ),
          })}
        </p>
      </Grid>
    </ContentLayout>
  );
};

export default ResearchImpact;
