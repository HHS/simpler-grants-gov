import { useTranslation } from "next-i18next";
import { Button, Grid, Icon } from "@trussworks/react-uswds";
import ContentLayout from "src/components/ContentLayout";
import Link from "next/link";

const IndexGoalContent = () => {
  const { t } = useTranslation("common", { keyPrefix: "Index" });

  return (
    <ContentLayout title={t("goal.title")} data-testid="goal-content">
      <Grid tabletLg={{ col: 6 }} desktop={{ col: 5 }} desktopLg={{ col: 6 }}>
        <p className="usa-intro">{t("goal.paragraph_1")}</p>
        <Link href="/process" passHref>
            <Button type="button" size="big">{t("goal.cta")} <Icon.Launch className="text-middle" size={4} /></Button>
          </Link>
      </Grid>
      <Grid tabletLg={{ col: 6 }} desktop={{ col: 7 }} desktopLg={{ col: 6 }}>
        <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
          {t("goal.title_2")}
        </h3>
        <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
          {t("goal.paragraph_2")}
        </p>
        <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
          {t("goal.title_3")}
        </h3>
        <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
          {t("goal.paragraph_3")}
        </p>
      </Grid>
    </ContentLayout>  
  )
};

export default IndexGoalContent;
