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

  const t = useTranslations("Search.saveSearch.copySearch");

  const url = useMemo(() => {
    const query = searchParams?.toString() ? `?${searchParams.toString()}` : "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${path}${query}`;
  }, [searchParams, path]);

  const copyText = useMemo(
    () => (user?.token ? t("copy.authenticated") : t("copy.unauthenticated")),
    [user?.token, t],
  );

  return (
    <div className="border-base-lighter border-1px padding-2 flex-align-start text-primary-darker text-underline display-flex">
      {checkFeatureFlag("savedSearchesOn") && user?.token && (
        <SaveSearchModal />
      )}
      <SearchQueryCopyButton
        copiedText={t("copied")}
        copyingText={t("copying")}
        copyText={copyText}
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
}
