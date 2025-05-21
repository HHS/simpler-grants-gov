import { Metadata } from "next";
import { SUBSCRIBE_CONFIRMATION_CRUMBS } from "src/constants/breadcrumbs";
import { LocalizedPageProps } from "src/types/intl";

import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import BetaAlert from "src/components/BetaAlert";
import Breadcrumbs from "src/components/Breadcrumbs";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Subscribe.page_title"),
    description: t("Index.meta_description"),
  };

  return meta;
}

export default function SubscriptionConfirmation({
  params,
}: LocalizedPageProps) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("Subscription_confirmation");

  return (
    <>
      <BetaAlert />
      <Breadcrumbs breadcrumbList={SUBSCRIBE_CONFIRMATION_CRUMBS} />

      <GridContainer className="padding-bottom-5 tablet:padding-top-0 desktop-lg:padding-top-0 border-bottom-2px border-base-lightest">
        <h1>
          {t("title")}
        </h1>
        <p className="usa-intro">
          {t("intro")}
        </p>
        <Grid row gap className="flex-align-start">
          <Grid>
            <p>{t("paragraph_1")}</p>
          </Grid>
        </Grid>
      </GridContainer>
      <GridContainer className="padding-bottom-5 tablet:padding-top-3 desktop-lg:padding-top-3">
        <p className="font-sans-3xs text-base-dark">{t("disclaimer")}</p>
      </GridContainer>
    </>
  );
}
