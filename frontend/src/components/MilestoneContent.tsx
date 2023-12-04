import { useTranslation } from "next-i18next";
import { Grid, GridContainer } from "@trussworks/react-uswds";

const MilestoneContent = () => {
  const { t } = useTranslation("common", { keyPrefix: "Milestones" });

  return (
    <div>
      <div className="bg-base-lightest">
        <strong>Learn about our first two project milestones</strong>
        <GridContainer className="padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-6 border-bottom-2px border-base-lightest">
          <h2 className="margin-bottom-0 tablet-lg:font-sans-xl desktop-lg:font-sans-2xl">
            {t("milestone_1_title")}
          </h2>
          <Grid row gap>
            <Grid tabletLg={{ col: 6 }} desktop={{ col: 5 }} desktopLg={{ col: 6 }}>
              <p className="usa-intro">{t("milestone_1_paragraph")}</p>
            </Grid>
            <Grid tabletLg={{ col: 6 }} desktop={{ col: 7 }} desktopLg={{ col: 6 }}>
              <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
                {t("milestone_1_goal_title_1")}
              </h3>
              <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
                {t("milestone_1_goal_paragraph_1")}
              </p>
              <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
                {t("milestone_1_goal_title_2")}
              </h3>
              <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
                {t("milestone_1_goal_paragraph_2")}
              </p>
            </Grid>
          </Grid>
        </GridContainer>
        <GridContainer className="padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-6 border-bottom-2px border-base-lightest">
          <h2 className="margin-bottom-0 tablet-lg:font-sans-xl desktop-lg:font-sans-2xl">
            {t("milestone_2_title")}
          </h2>
          <Grid row gap>
            <Grid tabletLg={{ col: 6 }} desktop={{ col: 5 }} desktopLg={{ col: 6 }}>
              <p className="usa-intro">{t("milestone_2_paragraph")}</p>
            </Grid>
            <Grid tabletLg={{ col: 6 }} desktop={{ col: 7 }} desktopLg={{ col: 6 }}>
              <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
                {t("milestone_2_goal_title_1")}
              </h3>
              <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
                {t("milestone_2_goal_paragraph_1")}
              </p>
              <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
                {t("milestone_2_goal_paragraph_2")}
              </p>
            </Grid>
          </Grid>
        </GridContainer>
      </div>
      <div>
      <GridContainer className="padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-6 border-bottom-2px border-base-lightest">
          <h2 className="margin-bottom-0 tablet-lg:font-sans-xl desktop-lg:font-sans-2xl">
            {t("get_involved_title")}
          </h2>
          <Grid row gap>
            <Grid tabletLg={{ col: 6 }} desktop={{ col: 5 }} desktopLg={{ col: 6 }}>
              <p className="usa-intro">{t("get_involved_paragraph")}</p>
            </Grid>
            <Grid tabletLg={{ col: 6 }} desktop={{ col: 7 }} desktopLg={{ col: 6 }}>
              <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
                {t("get_involved_goal_title")}
              </h3>
              <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
                {t("get_involved_goal_paragraph")}
              </p>
              <ul className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
                  <li><a href={t("get_involved_a_1")}>{t("get_involved_li_1")}</a></li>
                  <li><a href={t("get_involved_a_2")}>{t("get_involved_li_2")}</a></li>
                  <li><a href={t("get_involved_a_3")}>{t("get_involved_li_3")}</a></li>
                  <li><a href={t("get_involved_a_4")}>{t("get_involved_li_4")}</a></li>
                  <li><a href={t("get_involved_a_5")}>{t("get_involved_li_5")}</a></li>
              </ul>
            </Grid>
          </Grid>
        </GridContainer>
      </div>
    </div>
  );
};

export default MilestoneContent;
