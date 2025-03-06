"use client";

import { environment } from "src/constants/environments";

import { useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";

import SavedSearchQuery from "src/components/search/SavedSearchQuery";

export const SearchQuerySaveUserControl = () => {
  const path = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams?.toString() ? `?${searchParams.toString()}` : "";
  const url = `${environment.NEXT_PUBLIC_BASE_URL}${path}${query}`;
  const t = useTranslations("Search.savedQuery");
  return (
    <SavedSearchQuery
      copiedText={t("copied")}
      copyingText={t("copying")}
      copyText={t("copy.unauthenticated")}
      helpText={
        <div className="width-card-lg text-wrap">
          {t("help.unauthenticated")}
        </div>
      }
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
