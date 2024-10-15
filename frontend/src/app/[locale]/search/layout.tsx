import { SEARCH_CRUMBS } from "src/constants/breadcrumbs";

import { unstable_setRequestLocale } from "next-intl/server";

import BetaAlert from "src/components/BetaAlert";
import Breadcrumbs from "src/components/Breadcrumbs";
import SearchCallToAction from "src/components/search/SearchCallToAction";

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  unstable_setRequestLocale("en");
  return (
    <>
      <BetaAlert />
      <Breadcrumbs breadcrumbList={SEARCH_CRUMBS} />
      <SearchCallToAction />
      {children}
    </>
  );
}
