import { Metadata } from "next";
import VisionGetThere from "src/app/[locale]/vision/VisionGetThere";
import VisionGoals from "src/app/[locale]/vision/VisionGoals";
import VisionIntro from "src/app/[locale]/vision/VisionIntro";
import VisionMission from "src/app/[locale]/vision/VisionMission";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Vision.page_title"),
    description: t("Index.meta_description"),
  };
  return meta;
}

export default function Vision({ params }: LocalizedPageProps) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <>
      <VisionIntro />
      <VisionMission />
      <VisionGoals />
      <VisionGetThere />
    </>
  );
}
