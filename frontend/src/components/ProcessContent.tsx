import { useTranslation } from "next-i18next";
import { Grid, GridContainer } from "@trussworks/react-uswds";

const GoalContent = () => {
  const { t } = useTranslation("common", { keyPrefix: "Process" });

  return (
    <GridContainer className="padding-y-0 tablet:padding-y-0 desktop-lg:padding-y-0 border-bottom-2px border-base-lightest">
      <h1 className="margin-bottom-0 tablet-lg:font-sans-xl desktop-lg:font-sans-2xl">
        {t("title")}
      </h1>
      <Grid row gap>
        <Grid
          tabletLg={{ col: 12 }}
          desktop={{ col: 12 }}
          desktopLg={{ col: 12 }}
        >
          <p className="usa-intro">{t("content")}</p>
        </Grid>
      </Grid>
      <Grid row gap>
        <Grid tabletLg={{ col: 6 }} desktop={{ col: 7 }} desktopLg={{ col: 4 }}>
          <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
            {t("transparent_title")}
          </h3>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {t("transparent_content")}
          </p>
        </Grid>
        <Grid tabletLg={{ col: 6 }} desktop={{ col: 7 }} desktopLg={{ col: 4 }}>
          <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
            {t("iterative_title")}
          </h3>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {t("iterative_content")}
          </p>
        </Grid>
        <Grid tabletLg={{ col: 6 }} desktop={{ col: 7 }} desktopLg={{ col: 4 }}>
          <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
            {t("agile_title")}
          </h3>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {t("agile_content")}
          </p>
        </Grid>
      </Grid>
    </GridContainer>
  );
};

export default GoalContent;
