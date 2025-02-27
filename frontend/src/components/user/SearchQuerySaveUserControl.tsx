"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

// import SearchSavedQuery2 from "src/components/search/SearchSavedQuery2";
const SearchSavedQuery = dynamic(
  () => import("src/components/search/SearchSavedQuery"),
  { ssr: false },
);
const SearchSavedQuery2 = dynamic(
  () => import("src/components/search/SearchSavedQuery2"),
  { ssr: false },
);

export const SearchQuerySaveUserControl = () => {
  const t = useTranslations("Search.savedQuery");
  return (
    <>
      <SearchSavedQuery2
        copyText={t("copy.unauthenticated")}
        helpText={t("help.unauthenticated")}
      />
      <SearchSavedQuery
        copyText={t("copy.unauthenticated")}
        helpText={t("help.unauthenticated")}
      />
    </>
  );
};
