import { useTranslation } from "next-i18next";
import { Grid, GridContainer } from "@trussworks/react-uswds";

const GoalContent = () => {
  const { t } = useTranslation("common", { keyPrefix: "Process" });

  return (
    <GridContainer className="padding-bottom-5 tablet:padding-top-0 desktop-lg:padding-top-0 border-bottom-2px border-base-lightest">
      <h1 className="margin-0 tablet-lg:font-sans-xl desktop-lg:font-sans-2xl">
        {t("title")}
      </h1>
      <Grid row gap>
        <Grid
          tabletLg={{ col: 12 }}
          desktop={{ col: 12 }}
          desktopLg={{ col: 12 }}
        >
          <p className="tablet-lg:font-sans-xl line-height-sans-3 usa-intro margin-top-2">
            {t("content")}
          </p>
        </Grid>
      </Grid>
      <Grid row gap className="flex-align-start">
        <Grid tabletLg={{ col: 4 }} desktopLg={{ col: 4 }}>
          <div className="margin-bottom-2 desktop:margin-y-0 border radius-md border-base-lighter padding-x-3">
            <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
              {t("transparent_title")}
            </h3>
            <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
              {t("transparent_content")}
            </p>
          </div>
        </Grid>
        <Grid tabletLg={{ col: 4 }} desktopLg={{ col: 4 }}>
          <div className="margin-bottom-2 desktop:margin-y-0 border radius-md border-base-lighter padding-x-3">
            <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
              {t("iterative_title")}
            </h3>
            <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
              {t("iterative_content")}
            </p>
          </div>
        </Grid>
        <Grid tabletLg={{ col: 4 }} desktopLg={{ col: 4 }}>
          <div className="border radius-md border-base-lighter padding-x-3">
            <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
              {t("agile_title")}
            </h3>
            <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
              {t("agile_content")}
            </p>
          </div>
        </Grid>
      </Grid>
    </GridContainer>
  );
};

export default GoalContent;
