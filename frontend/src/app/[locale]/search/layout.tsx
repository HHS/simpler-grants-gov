import { SEARCH_CRUMBS } from "src/constants/breadcrumbs";

import { useTranslations } from "next-intl";
import { unstable_setRequestLocale } from "next-intl/server";

import BetaAlert from "src/components/BetaAlert";
import Breadcrumbs from "src/components/Breadcrumbs";
import PageSEO from "src/components/PageSEO";
import SearchCallToAction from "src/components/search/SearchCallToAction";

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  unstable_setRequestLocale("en");
  const t = useTranslations("Search");
  return (
    <>
      <PageSEO title={t("title")} description={t("meta_description")} />
      <BetaAlert />
      <Breadcrumbs breadcrumbList={SEARCH_CRUMBS} />
      <SearchCallToAction />
      {children}
    </>
  );
}
