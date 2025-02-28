"use client";

import { environment } from "src/constants/environments";

import { useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";

import SearchSavedQuery from "src/components/search/SearchSavedQuery";

export const SearchQuerySaveUserControl = () => {
  const path = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams ? `?${searchParams.toString()}` : "";
  const url = `${environment.NEXT_PUBLIC_BASE_URL}${path}${query}`;
  const t = useTranslations("Search.savedQuery");
  return (
    <SearchSavedQuery
      copiedText={t("copied")}
      copyingText={t("copying")}
      copyText={t("copy.unauthenticated")}
      helpText={t("help.unauthenticated")}
      url={url}
      snackbarMessage={t.rich("snackbar", {
        br: () => (
          <>
            <br />
          </>
        ),
      })}
    />
  );
};
