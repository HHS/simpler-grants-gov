import { ExternalRoutes } from "src/constants/routes";

import { useTranslation } from "next-i18next";
import Link from "next/link";
import { Button, Grid, Icon } from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";

const ProcessMethodology = () => {
  const { t } = useTranslation("common", { keyPrefix: "Process" });

  return (
    <div className="padding-top-4 bg-gray-5">
      <Grid tabletLg={{ col: 6 }} className="grid-container">
        <strong className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
          {t("milestones.tag")}
        </strong>
      </Grid>
      <ContentLayout
        title={t("milestones.title_1")}
        data-testid="process-methodology-content"
        titleSize="m"
        bottomBorder="none"
      >
        <Grid tabletLg={{ col: 6 }}>
          <p className="usa-intro">{t("milestones.paragraph_1")}</p>
        </Grid>
        <Grid tabletLg={{ col: 6 }}>
          <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
            {t("milestones.sub_title_1")}
          </h3>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {t("milestones.sub_paragraph_1")}
          </p>
          <h3 className="tablet-lg:font-sans-lg margin-top-4 margin-bottom-2">
            {t("milestones.sub_title_2")}
          </h3>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {t("milestones.sub_paragraph_2")}
          </p>
          <Link href={ExternalRoutes.MILESTONES} passHref>
            <Button className="margin-bottom-4" type="button" size="big">
              {t("milestones.cta_1")}{" "}
              <Icon.Launch
                className="text-middle"
                size={4}
                aria-label="launch"
              />
            </Button>
          </Link>
        </Grid>
      </ContentLayout>
      <ContentLayout
        title={t("milestones.title_2")}
        data-testid="process-methodology-content"
        titleSize="m"
        bottomBorder="none"
        paddingTop={false}
      >
        <Grid tabletLg={{ col: 6 }}>
          <p className="usa-intro">{t("milestones.paragraph_2")}</p>
        </Grid>
        <Grid tabletLg={{ col: 6 }}>
          <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
            {t("milestones.sub_title_3")}
          </h3>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {t("milestones.sub_paragraph_3")}
          </p>
          <Link href={ExternalRoutes.MILESTONES} passHref>
            <Button className="margin-bottom-4" type="button" size="big">
              {t("milestones.cta_2")}{" "}
              <Icon.Launch
                className="text-middle"
                size={4}
                aria-label="launch"
              />
            </Button>
          </Link>
        </Grid>
      </ContentLayout>
    </div>
  );
};

export default ProcessMethodology;
