import { Metadata } from "next";
import { LayoutProps } from "src/types/generalTypes";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";

import { AuthenticationGate } from "src/components/user/AuthenticationGate";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const pageTitle =
    t("Opportunities.pageTitle") + " | " + t("Opportunities.pageApplication");
  const meta: Metadata = {
    title: pageTitle,
    description: t("Opportunities.metaDescription"),
  };
  return meta;
}

export default function OpportunitiesLayout({ children }: LayoutProps) {
  return (
    <>
      <AuthenticationGate>{children}</AuthenticationGate>
    </>
  );
}
