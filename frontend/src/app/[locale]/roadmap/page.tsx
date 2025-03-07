import "./roadmap.scss";

import { Metadata } from "next";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";

import RoadmapHeader from "./RoadmapHeader";
import RoadmapMilestones from "./RoadmapMilestones";
import RoadmapProcess from "./RoadmapProcess";
import RoadmapWhatWereWorkingOn from "./RoadmapWhatWereWorkingOn";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Roadmap.pageTitle"),
    description: t("Index.meta_description"),
  };
  return meta;
}

export default function Roadmap() {
  return (
    <>
      <RoadmapHeader />
      <RoadmapWhatWereWorkingOn />
      <RoadmapMilestones />
      <RoadmapProcess />
    </>
  );
}
