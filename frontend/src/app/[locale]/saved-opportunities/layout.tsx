import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Breadcrumbs from "src/components/Breadcrumbs";
import { AuthenticationGate } from "src/components/user/AuthenticationGate";
import { SAVED_OPPORTUNITIES_CRUMBS } from "src/constants/breadcrumbs";
import { LayoutProps } from "src/types/generalTypes";
import { LocalizedPageProps } from "src/types/intl";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("SavedOpportunities.title"),
    description: t("Index.meta_description"),
  };
  return meta;
}

export default function SavedOpportunitiesLayout({ children }: LayoutProps) {
  return (
    <>
      <Breadcrumbs breadcrumbList={SAVED_OPPORTUNITIES_CRUMBS} />
      <AuthenticationGate>{children}</AuthenticationGate>
    </>
  );
}
