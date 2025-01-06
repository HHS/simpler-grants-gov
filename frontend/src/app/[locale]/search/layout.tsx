import { SEARCH_CRUMBS } from "src/constants/breadcrumbs";

import { setRequestLocale } from "next-intl/server";

import BetaAlert from "src/components/BetaAlert";
import Breadcrumbs from "src/components/Breadcrumbs";
import SearchCallToAction from "src/components/search/SearchCallToAction";

export default function SearchLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}) {
  setRequestLocale(locale);
  return (
    <>
      <BetaAlert containerClasses="margin-top-5" />
      <Breadcrumbs breadcrumbList={SEARCH_CRUMBS} />
      <SearchCallToAction />
      {children}
    </>
  );
}
