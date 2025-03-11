"use client";

import { useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import SearchQueryCopyButton from "src/components/search/SearchQueryCopyButton";

export const SaveSearchPanel = () => {
  const path = usePathname();
  const searchParams = useSearchParams();

  const url = useMemo(() => {
    const query = searchParams?.toString() ? `?${searchParams.toString()}` : "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${path}${query}`;
  }, [searchParams, path]);

  const t = useTranslations("Search.savedQuery");
  return (
    <div className="border-base-lighter border-1px padding-2 flex-align-start text-primary-darker text-underline display-flex">
      <SearchQueryCopyButton
        copiedText={t("copied")}
        copyingText={t("copying")}
        copyText={t("copy.unauthenticated")}
        helpText={
          <div className="width-card-lg text-wrap">
            {t("help.unauthenticated")}
          </div>
        }
        url={url}
        snackbarMessage={t("snackbar")}
      />
    </div>
  );
};
