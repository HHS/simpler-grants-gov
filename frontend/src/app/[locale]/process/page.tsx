import { Metadata } from "next";
import ProcessIntro from "src/app/[locale]/process/ProcessIntro";
import ProcessInvolved from "src/app/[locale]/process/ProcessInvolved";
import ProcessMilestones from "src/app/[locale]/process/ProcessMilestones";
import { PROCESS_CRUMBS } from "src/constants/breadcrumbs";

import { getTranslations } from "next-intl/server";

import BetaAlert from "src/components/BetaAlert";
import Breadcrumbs from "src/components/Breadcrumbs";

export async function generateMetadata() {
  const t = await getTranslations({ locale: "en" });
  const meta: Metadata = {
    title: t("Process.page_title"),
    description: t("Process.meta_description"),
  };
  return meta;
}

export default function Process() {
  return (
    <>
      <BetaAlert />
      <Breadcrumbs breadcrumbList={PROCESS_CRUMBS} />
      <ProcessIntro />
      <div className="padding-top-4 bg-gray-5">
        <ProcessMilestones />
      </div>
      <ProcessInvolved />
    </>
  );
}
