import { ExternalRoutes } from "src/constants/routes";

import { Trans, useTranslation } from "next-i18next";
import { Grid } from "@trussworks/react-uswds";
import { useTranslations } from "next-intl";

import ContentLayout from "src/components/ContentLayout";

const ProcessInvolved = () => {
//  const { t } = useTranslation("common", { keyPrefix: "Process" });
  const t = useTranslations("Process");
  const email = ExternalRoutes.EMAIL_SIMPLERGRANTSGOV;

  return (
    <ContentLayout data-testid="process-involved-content" bottomBorder="none">
      <Grid row gap="lg">
        <Grid tabletLg={{ col: 6 }}>
          <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
            {t("involved.title_1")}
          </h3>
          <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
          </p>
        </Grid>
        <Grid tabletLg={{ col: 6 }}>
          <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
            {t("involved.title_2")}
          </h3>
          <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
          </p>
        </Grid>
      </Grid>
    </ContentLayout>
  );
};

export default ProcessInvolved;
