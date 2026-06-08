import { Metadata } from "next";
import ResearchParticipantGuideContent from "src/app/[locale]/(base)/research-participant-guide/_components/ResearchParticipantGuide";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("ResearchParticipantGuide.pageTitle"),
    description: t("ResearchParticipantGuide.pageDescription"),
  };
  return meta;
}

export default function ResearchParticipantGuide() {
  return <ResearchParticipantGuideContent />;
}
