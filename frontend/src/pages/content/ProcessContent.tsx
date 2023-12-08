import { useTranslation } from "next-i18next";
import { Grid } from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";

const ProcessContent = () => {
  const { t } = useTranslation("common", { keyPrefix: "Process" });

  return (
    <ContentLayout
      title={t("title")}
      data-testid="process-intro-content"
      paddingTop={false}
    >
      <Grid row gap>
        <Grid>
          <p className="tablet-lg:font-sans-xl line-height-sans-3 usa-intro margin-top-2">
            {t("content")}
          </p>
        </Grid>
      </Grid>
      <Grid row gap className="flex-align-start">
        <Grid tabletLg={{ col: 4 }} desktopLg={{ col: 4 }}>
          <div className="margin-bottom-2 desktop:margin-y-0 border radius-md border-base-lighter padding-3">
            <strong className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
              {t("transparent_title")}
            </strong>
            <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
              {t("transparent_content")}
            </p>
          </div>
        </Grid>
        <Grid tabletLg={{ col: 4 }} desktopLg={{ col: 4 }}>
          <div className="margin-bottom-2 desktop:margin-y-0 border radius-md border-base-lighter padding-3">
            <strong className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
              {t("iterative_title")}
            </strong>
            <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
              {t("iterative_content")}
            </p>
          </div>
        </Grid>
        <Grid tabletLg={{ col: 4 }} desktopLg={{ col: 4 }}>
          <div className="border radius-md border-base-lighter padding-3">
            <strong className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
              {t("agile_title")}
            </strong>
            <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
              {t("agile_content")}
            </p>
          </div>
        </Grid>
      </Grid>
    </ContentLayout>
  );
};

export default ProcessContent;
