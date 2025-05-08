import { Metadata } from "next";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";

import RoadmapPageSections from "src/components/roadmap/RoadmapSections";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Roadmap.pageTitle"),
    description: t("Index.metaDescription"),
  };
  return meta;
}

export default function Roadmap() {
  return <RoadmapPageSections />;
}
