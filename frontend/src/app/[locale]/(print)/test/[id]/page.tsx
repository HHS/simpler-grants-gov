import { Metadata } from "next";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";

import VisionPageSections from "src/components/vision/VisionSections";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Vision.pageTitle"),
    description: t("Index.metaDescription"),
  };
  return meta;
}

interface Props {
  params: Promise<{ id: string;}>;
}

export default async function Vision({ params }: Props) {

    const { id } = await params;

  return <>{id}<VisionPageSections /> </>;
}
