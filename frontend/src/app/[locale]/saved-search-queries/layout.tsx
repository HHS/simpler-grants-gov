import { Metadata } from "next";
import { SAVED_SEARCHES_CRUMBS } from "src/constants/breadcrumbs";
import { LayoutProps } from "src/types/generalTypes";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";

import Breadcrumbs from "src/components/Breadcrumbs";
import { AuthenticationGate } from "src/components/user/AuthenticationGate";

export async function generateMetadata({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("SavedSearches.title"),
    description: t("Index.meta_description"),
  };
  return meta;
}

export default function SavedSearchesLayout({ children }: LayoutProps) {
  return (
    <>
      <Breadcrumbs breadcrumbList={SAVED_SEARCHES_CRUMBS} />
      <AuthenticationGate>{children}</AuthenticationGate>
    </>
  );
}
