import type { GetStaticProps, NextPage } from "next";
import { NEWSLETTER_UNSUBSCRIBE_CRUMBS } from "src/constants/breadcrumbs";

import { Trans, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Link from "next/link";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import PageSEO from "src/components/PageSEO";
import BetaAlert from "../../components/BetaAlert";

const NewsletterUnsubscribe: NextPage = () => {
  const { t } = useTranslation("common");
  const beta_strings = {
    alert_title: t("Beta_alert.alert_title"),
    alert: t("Beta_alert.alert"),
  };

  return (
    <>
      <PageSEO
        title={t("Newsletter_unsubscribe.page_title")}
        description={t("Newsletter_unsubscribe.meta_description")}
      />
      <BetaAlert beta_strings={beta_strings} />
      <Breadcrumbs breadcrumbList={NEWSLETTER_UNSUBSCRIBE_CRUMBS} />

      <GridContainer className="padding-bottom-5 tablet:padding-top-0 desktop-lg:padding-top-0 border-bottom-2px border-base-lightest">
        <h1 className="margin-0 tablet-lg:font-sans-xl desktop-lg:font-sans-2xl">
          {t("Newsletter_unsubscribe.title")}
        </h1>
        <p className="usa-intro font-sans-md tablet:font-sans-lg desktop-lg:font-sans-xl margin-bottom-0">
          {t("Newsletter_unsubscribe.intro")}
        </p>
        <Grid row gap className="flex-align-start">
          <Grid tabletLg={{ col: 6 }}>
            <p className="usa-intro">
              {t("Newsletter_unsubscribe.paragraph_1")}
            </p>
            <Link className="usa-button margin-bottom-4" href="/newsletter">
              {t("Newsletter_unsubscribe.button_resub")}
            </Link>
          </Grid>
          <Grid tabletLg={{ col: 6 }}>
            <h2 className="font-sans-md tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
              {t("Newsletter_unsubscribe.heading")}
            </h2>
            <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
              <Trans
                t={t}
                i18nKey="Newsletter_unsubscribe.paragraph_2"
                components={{
                  "process-link": <Link href="/process" />,
                  "research-link": <Link href="/research" />,
                }}
              />
            </p>
          </Grid>
        </Grid>
      </GridContainer>
      <GridContainer className="padding-bottom-5 tablet:padding-top-3 desktop-lg:padding-top-3">
        <p className="font-sans-3xs text-base-dark">
          {t("Newsletter_unsubscribe.disclaimer")}
        </p>
      </GridContainer>
    </>
  );
};

// Change this to GetServerSideProps if you're using server-side rendering
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const translations = await serverSideTranslations(locale ?? "en");
  return { props: { ...translations } };
};

export default NewsletterUnsubscribe;
