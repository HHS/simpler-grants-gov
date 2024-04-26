import { Metadata } from "next";
import type { GetStaticProps, NextPage } from "next";
import { PROCESS_CRUMBS } from "src/constants/breadcrumbs";

import { useTranslation } from "next-i18next";
import { getTranslations, getMessages } from "next-intl/server";

import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import Breadcrumbs from "src/components/Breadcrumbs";
import PageSEO from "src/components/PageSEO";
import BetaAlert from "src/components/AppBetaAlert";
import ProcessInvolved from "src/pages/content/ProcessInvolved";

interface RouteParams {
  locale: string;
}

import {
  NextIntlClientProvider,
  useMessages,
  useTranslations,
} from "next-intl";



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
      <NextIntlClientProvider
        locale="en"
        messages={messages}
      >
        <BetaAlert />
      </NextIntlClientProvider>
      <Breadcrumbs breadcrumbList={PROCESS_CRUMBS} />
    </>
  );
};
