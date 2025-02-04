import { SEARCH_CRUMBS } from "src/constants/breadcrumbs";
import { LayoutProps } from "src/types/generalTypes";

import { setRequestLocale } from "next-intl/server";
import { use } from "react";

import BetaAlert from "src/components/BetaAlert";
import Breadcrumbs from "src/components/Breadcrumbs";
import SearchCallToAction from "src/components/search/SearchCallToAction";

export default function SearchLayout({ children, params }: LayoutProps) {
  const { locale } = use(params);
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
