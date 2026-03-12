import { Metadata } from "next";
import { LocalizedPageProps } from "src/types/intl";

import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { use } from "react";
import { GridContainer } from "@trussworks/react-uswds";

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
    <div className="padding-top-2 tablet:padding-y-6">
      <GridContainer>
        <h1>{t("title")}</h1>
        <p>{t("paragraph")}</p>
        <p>
          {t("cta") + " "}
          <Link href="/newsletter">{t("buttonResub")}</Link>
        </p>
      </GridContainer>
      <SendyDisclaimer />
    </div>
  );
}
