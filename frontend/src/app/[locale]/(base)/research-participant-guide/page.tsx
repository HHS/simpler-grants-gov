import { Metadata } from "next";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";

import ResearchParticipantGuideContent from "src/components/research-participant-guide/ResearchParticipantGuide";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("ResearchParticipantGuide.metaTitle"),
    description: t("ResearchParticipantGuide.metaDescription"),
  };
  return meta;
}

export default function ResearchParticipantGuide() {
  return <ResearchParticipantGuideContent />;
}
