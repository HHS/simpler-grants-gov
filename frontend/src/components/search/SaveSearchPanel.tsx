"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { useUser } from "src/services/auth/useUser";

import { useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { SaveSearchModal } from "./SaveSearchModal";
import SearchQueryCopyButton from "./SearchQueryCopyButton";

export function SaveSearchPanel() {
  const { checkFeatureFlag } = useFeatureFlags();
  const { user } = useUser();
  const path = usePathname();
  const searchParams = useSearchParams();

  const url = useMemo(() => {
    const query = searchParams?.toString() ? `?${searchParams.toString()}` : "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${path}${query}`;
  }, [searchParams, path]);

  const t = useTranslations("Search.saveSearch.copySearch");

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
      {checkFeatureFlag("savedSearchesOn") && user?.token && (
        <SaveSearchModal />
      )}
    </div>
  );
}
