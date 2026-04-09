import { Metadata } from "next";
import { LayoutProps } from "src/types/generalTypes";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";

import { AuthenticationGate } from "src/components/user/AuthenticationGate";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("Applications.pageTitle"),
    description: t("Applications.metaDescription"),
  };
  return meta;
}

export default function ApplicationsLayout({ children }: LayoutProps) {
  return (
    <>
      <AuthenticationGate>{children}</AuthenticationGate>
    </>
  );
}
