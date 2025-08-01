import { Metadata } from "next";
import { SUBSCRIBE_CRUMBS } from "src/constants/breadcrumbs";
import { LocalizedPageProps } from "src/types/intl";

import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import BetaAlert from "src/components/BetaAlert";
import Breadcrumbs from "src/components/Breadcrumbs";
import SubscriptionForm from "src/components/subscribe/SubscriptionForm";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Subscribe.pageTitle"),
    description: t("Subscribe.metaDescription"),
  };

  return meta;
}

export default function Subscribe({ params }: LocalizedPageProps) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("Subscribe");

  return (
    <>
      <BetaAlert containerClasses="margin-top-5" />

      <GridContainer className="padding-bottom-5 tablet:padding-top-0 desktop-lg:padding-top-0 border-bottom-2px border-base-lightest">
        <Breadcrumbs breadcrumbList={SUBSCRIBE_CRUMBS} />
        <h1 className="margin-top-0">{t("title")}</h1>
        <p className="usa-intro">{t("intro")}</p>
        <Grid row gap className="flex-align-start">
          <Grid tabletLg={{ col: 6 }}>
            <p>{t("paragraph1")}</p>
            {t.rich("list", {
              ul: (chunks) => <ul className="usa-list">{chunks}</ul>,
              li: (chunks) => <li>{chunks}</li>,
            })}
          </Grid>
          <Grid tabletLg={{ col: 6 }}>
            <SubscriptionForm />
          </Grid>
        </Grid>
      </GridContainer>
      <GridContainer className="padding-bottom-5 tablet:padding-top-3 desktop-lg:padding-top-3">
        <p className="font-sans-3xs text-base-dark">{t("disclaimer")}</p>
      </GridContainer>
    </>
  );
}
