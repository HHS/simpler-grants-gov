import { useTranslation, Trans } from "next-i18next";
import { Button, Grid, Icon } from "@trussworks/react-uswds";
import ContentLayout from "src/components/ContentLayout";
import Link from "next/link";

const IndexResearchContent = () => {
  const { t } = useTranslation("common", { keyPrefix: "Index" });

  return (
    <ContentLayout title={t("research.title")} data-testid="research-content">
      <Grid tabletLg={{ col: 6 }} desktop={{ col: 5 }} desktopLg={{ col: 6 }}>
        <p className="usa-intro">{t("research.paragraph_1")}</p>
        <Link href="/process" passHref>
            <Button type="button" size="big">{t("research.cta")} <Icon.ArrowForward className="text-middle" size={4} /></Button>
          </Link>
      </Grid>
      <Grid tabletLg={{ col: 6 }} desktop={{ col: 7 }} desktopLg={{ col: 6 }}>
        <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
          {t("research.title_2")}
        </h3>
        <p className="usa-intro"><Trans t={t} i18nKey="research.paragraph_2" /></p>
        <p className="usa-intro"><Trans t={t} i18nKey="research.paragraph_3" /></p>
        <p className="usa-intro"><Trans t={t} i18nKey="research.paragraph_4" /></p>
        <p className="usa-intro"><Trans t={t} i18nKey="research.paragraph_5" /></p>
      </Grid>
    </ContentLayout>  
  )
};

export default IndexResearchContent;