"use client";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
// import SearchSavedQuery from "src/components/search/SearchSavedQuery";
const SearchSavedQuery = dynamic(() => import('src/components/search/SearchSavedQuery'), { ssr: false })

export const SearchQuerySaveUserControl = () => {
  const t = useTranslations("Search.savedQuery");
  return (
    <>
      <SearchSavedQuery
        copyText={t("copy.unauthenticated")}
        helpText={t("help.unauthenticated")}
      />
    </>
  );
};
