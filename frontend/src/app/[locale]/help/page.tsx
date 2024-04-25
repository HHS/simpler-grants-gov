import { Metadata } from "next";
import type { GetStaticProps, NextPage } from "next";
import { PROCESS_CRUMBS } from "src/constants/breadcrumbs";

import { useTranslation } from "next-i18next";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";

import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import Breadcrumbs from "src/components/Breadcrumbs";
import PageSEO from "src/components/PageSEO";
import BetaAlert from "src/components/BetaAlert";
import ProcessContent from "../../../pages/content/ProcessIntro";
import ProcessInvolved from "../../../pages/content/ProcessInvolved";
import ProcessMilestones from "../../../pages/content/ProcessMilestones";

interface RouteParams {
  locale: string;
}

export async function generateMetadata({ params }: { params: RouteParams }) {
  const t = await getTranslations({ locale: params.locale });
  const meta: Metadata = {
    title: t("Process.title"),
  };

  return meta;
}

export default function Help() {
  const t = useTranslations();

  const beta_strings = {
    alert_title: t("Beta_alert.title"),
    alert: t("Beta_alert.alert"),
  };

  return (
    <>
      <PageSEO
        title={t("Process.page_title")}
        description={t("Process.meta_description")}
      />
      <BetaAlert beta_strings={beta_strings} />
      <Breadcrumbs breadcrumbList={PROCESS_CRUMBS} />
      <ProcessInvolved />
    </>
  );
};
