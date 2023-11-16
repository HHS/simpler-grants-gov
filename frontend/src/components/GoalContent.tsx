import { useTranslation } from "next-i18next";
import { Grid, GridContainer } from "@trussworks/react-uswds";

const GoalContent = () => {
  const { t } = useTranslation("common", { keyPrefix: "Index" });

  return (
    <GridContainer className="padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-6 border-bottom-2px border-base-lightest">
      <h2 className="margin-bottom-0 tablet-lg:font-sans-xl desktop-lg:font-sans-2xl">
        {t("goal_title")}
      </h2>
      <Grid row gap>
        <Grid tabletLg={{ col: 6 }} desktop={{ col: 5 }} desktopLg={{ col: 6 }}>
          <p className="usa-intro">{t("goal_paragraph_1")}</p>
        </Grid>
        <Grid tabletLg={{ col: 6 }} desktop={{ col: 7 }} desktopLg={{ col: 6 }}>
          <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
            {t("goal_title_2")}
          </h3>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {t("goal_paragraph_2")}
          </p>
          <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
            {t("goal_title_3")}
          </h3>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {t("goal_paragraph_3")}
          </p>
        </Grid>
      </Grid>
    </GridContainer>
  );
};

export default GoalContent;
