import type { GetStaticProps, NextPage } from "next";
import { NEWSLETTER_UNSUBSCRIBE_CRUMBS } from "src/constants/breadcrumbs";
import { ExternalRoutes } from "src/constants/routes";

import { Trans, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Link from "next/link";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import PageSEO from "src/components/PageSEO";
import FullWidthAlert from "../components/FullWidthAlert";

const NewsletterUnsubscribe: NextPage = () => {
  const { t } = useTranslation("common", {
    keyPrefix: "Newsletter_unsubscribe",
  });

  return (
    <>
      <PageSEO title={t("page_title")} description={t("meta_description")} />
      <FullWidthAlert type="info" heading={t("alert_title")}>
        <Trans
          t={t}
          i18nKey="alert"
          components={{
            LinkToGrants: (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={ExternalRoutes.GRANTS_HOME}
              />
            ),
          }}
        />
      </FullWidthAlert>
      <Breadcrumbs breadcrumbList={NEWSLETTER_UNSUBSCRIBE_CRUMBS} />

      <GridContainer className="padding-bottom-5 tablet:padding-top-0 desktop-lg:padding-top-0 border-bottom-2px border-base-lightest">
        <h1 className="margin-0 tablet-lg:font-sans-xl desktop-lg:font-sans-2xl">
          {t("title")}
        </h1>
        <p className="usa-intro font-sans-md tablet:font-sans-lg desktop-lg:font-sans-xl margin-bottom-0">
          {t("intro")}
        </p>
        <Grid row gap className="flex-align-start">
          <Grid tabletLg={{ col: 6 }}>
            <p className="usa-intro">{t("paragraph_1")}</p>
            <Link className="usa-button" href="/newsletter">
              {t("button_resub")}
            </Link>
          </Grid>
          <Grid tabletLg={{ col: 6 }}>
            <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
              {t("heading")}
            </h3>
            <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
              <Trans
                t={t}
                i18nKey="paragraph_2"
                components={{
                  "process-link": <Link href="/process" />,
                  "research-link": <Link href="/research" />,
                }}
              />
            </p>
          </Grid>
        </Grid>
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
