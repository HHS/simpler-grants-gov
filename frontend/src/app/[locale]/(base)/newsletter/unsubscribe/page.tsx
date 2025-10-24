import { Metadata } from "next";
import { UNSUBSCRIBE_CRUMBS } from "src/constants/breadcrumbs";
import { LocalizedPageProps } from "src/types/intl";

import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { use } from "react";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import SendyDisclaimer from "src/components/newsletter/SendyDisclaimer";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Subscribe.pageTitle"),
    description: t("Index.metaDescription"),
  };

  return meta;
}

export default function Unsubscribe({ params }: LocalizedPageProps) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("UnsubscriptionConfirmation");

  return (
    <>
      <GridContainer>
        <Breadcrumbs breadcrumbList={UNSUBSCRIBE_CRUMBS} />
        <h1 className="margin-top-0">{t("title")}</h1>
        <p className="usa-intro">{t("intro")}</p>
        <Grid row gap className="flex-align-start">
          <Grid>
            <p>{t("paragraph")}</p>
            <Link className="usa-button" href="/newsletter">
              {t("buttonResub")}
            </Link>
          </Grid>
        </Grid>
      </GridContainer>
      <SendyDisclaimer />
    </>
  );
}
