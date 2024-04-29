import { Metadata } from "next";
import { PROCESS_CRUMBS } from "src/constants/breadcrumbs";

import { getTranslations, getMessages } from "next-intl/server";

import Breadcrumbs from "src/components/Breadcrumbs";
import PageSEO from "src/components/PageSEO";
import BetaAlert from "src/components/AppBetaAlert";

import { NextIntlClientProvider } from "next-intl";

interface RouteParams {
  locale: string;
}

export async function generateMetadata({ params }: { params: RouteParams }) {
  const t = await getTranslations({ locale: params.locale });
  const meta: Metadata = {
    title: t("Process.page_title"),
  };
  return meta;
}

export default async function Help() {
  const t = await getTranslations();
  const messages = await getMessages();

  return (
    <>
      <PageSEO
        title={t("Process.page_title")}
        description={t("Process.meta_description")}
      />
      <NextIntlClientProvider locale="en" messages={messages}>
        <BetaAlert />
      </NextIntlClientProvider>
      <Breadcrumbs breadcrumbList={PROCESS_CRUMBS} />
    </>
  );
}
