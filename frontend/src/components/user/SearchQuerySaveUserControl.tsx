"use client";

import { environment } from "src/constants/environments";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";

const SearchSavedQuery = dynamic(
  () => import("src/components/search/SearchSavedQuery"),
  { ssr: false },
);

export const SearchQuerySaveUserControl = () => {
  const path = usePathname();
  const searchParams = useSearchParams();
  const url = `${environment.NEXT_PUBLIC_BASE_URL}${path}?${searchParams.toString()}`;
  const t = useTranslations("Search.savedQuery");
  return (
    <>
      <SearchSavedQuery
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
    </>
  );
};
