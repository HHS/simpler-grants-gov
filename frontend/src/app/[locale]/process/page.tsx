import { Metadata } from "next";
import ProcessIntro from "src/app/[locale]/process/ProcessIntro";
import ProcessInvolved from "src/app/[locale]/process/ProcessInvolved";
import ProcessNext from "src/app/[locale]/process/ProcessNext";
import ProcessProgress from "src/app/[locale]/process/ProcessProgress";
import { PROCESS_CRUMBS } from "src/constants/breadcrumbs";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations, setRequestLocale } from "next-intl/server";

import BetaAlert from "src/components/BetaAlert";
import Breadcrumbs from "src/components/Breadcrumbs";

export async function generateMetadata({
  params: { locale },
}: LocalizedPageProps) {
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Process.page_title"),
    description: t("Process.meta_description"),
  };
  return meta;
}

export default function Process({ params: { locale } }: LocalizedPageProps) {
  setRequestLocale(locale);
  return (
    <>
      <BetaAlert containerClasses="margin-top-5" />
      <Breadcrumbs breadcrumbList={PROCESS_CRUMBS} />
      <ProcessIntro />
      <div className="padding-top-4 bg-gray-5">
        <ProcessProgress />
      </div>
      <div className="padding-top-4 bg-gray-5">
        <ProcessNext />
      </div>
      <ProcessInvolved />
    </>
  );
}
