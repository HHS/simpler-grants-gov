import { Metadata } from "next";
import { UNSUBSCRIBE_CRUMBS } from "src/constants/breadcrumbs";
import { LocalizedPageProps } from "src/types/intl";

import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { use } from "react";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import BetaAlert from "src/components/BetaAlert";
import Breadcrumbs from "src/components/Breadcrumbs";

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
      <BetaAlert />
      <Breadcrumbs breadcrumbList={UNSUBSCRIBE_CRUMBS} />

      <GridContainer className="padding-bottom-5 tablet:padding-top-0 desktop-lg:padding-top-0 border-bottom-2px border-base-lightest">
        <h1>{t("title")}</h1>
        <p className="usa-intro">{t("intro")}</p>
        <Grid row gap className="flex-align-start">
          <Grid>
<<<<<<< HEAD
            <p>{t("paragraph_1")}</p>
=======
            <p className="usa-intro">{t("paragraph")}</p>
>>>>>>> 3f84e0441 (Update key names in i18n/en/index to be camelCase instead of snake_case)
            <Link className="usa-button margin-bottom-4" href="/subscribe">
              {t("buttonResub")}
            </Link>
          </Grid>
        </Grid>
      </GridContainer>
      <GridContainer className="padding-bottom-5 tablet:padding-top-3 desktop-lg:padding-top-3">
        <p className="font-sans-3xs text-base-dark">{t("disclaimer")}</p>
      </GridContainer>
    </>
  );
}
