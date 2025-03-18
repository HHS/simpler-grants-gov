"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { useUser } from "src/services/auth/useUser";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { USWDSIcon } from "src/components/USWDSIcon";
import { SaveSearchModal } from "./SaveSearchModal";
import SearchQueryCopyButton from "./SearchQueryCopyButton";

const TooltipWrapper = dynamic(() => import("src/components/TooltipWrapper"), {
  ssr: false,
  loading: () => <USWDSIcon className="margin-left-1" name="info_outline" />,
});

const SaveSearchTooltip = ({
  text,
  title,
}: {
  text: string;
  title: string;
}) => {
  return (
    <TooltipWrapper
      className="margin-left-1 usa-button--unstyled"
      label={<div className="width-card-lg text-wrap">{text}</div>}
      position="top"
      title={title}
    >
      <USWDSIcon className="text-secondary-darker" name="info_outline" />
    </TooltipWrapper>
  );
};

export function SaveSearchPanel() {
  const { checkFeatureFlag } = useFeatureFlags();
  const { user } = useUser();
  const path = usePathname();
  const searchParams = useSearchParams();

  const t = useTranslations("Search.saveSearch");

  const url = useMemo(() => {
    const query = searchParams?.toString() ? `?${searchParams.toString()}` : "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${path}${query}`;
  }, [searchParams, path]);

  const copyText = useMemo(
    () =>
      user?.token
        ? t("copySearch.copy.authenticated")
        : t("copySearch.copy.unauthenticated"),
    [user?.token, t],
  );

  const showSavedSearchUI = useMemo(
    () => checkFeatureFlag("savedSearchesOn") && user?.token,
    [user?.token, checkFeatureFlag],
  );

  return (
    <div className="border-base-lighter border-1px padding-2 text-primary-darker">
      {showSavedSearchUI && (
        <div className="margin-bottom-2 display-flex">
          <span className="text-bold">{t("heading")}</span>
          <SaveSearchTooltip
            text={t("help.noSavedQueries")}
            title={t("help.general")}
          />
        </div>
      )}
      <div className="display-flex flex-align-start text-underline">
        {showSavedSearchUI && <SaveSearchModal />}
        <SearchQueryCopyButton
          copiedText={t("copySearch.copied")}
          copyingText={t("copySearch.copying")}
          copyText={copyText}
          url={url}
          snackbarMessage={t("copySearch.snackbar")}
        >
          {!showSavedSearchUI && (
            <SaveSearchTooltip
              text={t("help.unauthenticated")}
              title={t("help.general")}
            />
          )}
        </SearchQueryCopyButton>
      </div>
    </div>
  );
}
