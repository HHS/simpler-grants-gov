import { Metadata } from "next";
import VisionPageSections from "src/app/[locale]/(base)/vision/_components/VisionSections";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Vision.pageTitle"),
    description: t("Index.metaDescription"),
  };
  return meta;
}

export default function Vision() {
  return <VisionPageSections />;
}
