"use client";

import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";

import { useTranslations } from "next-intl";
import { Button } from "@trussworks/react-uswds";

export function SearchDrawerHeading() {
  const t = useTranslations("Search.drawer");
  const { clearQueryParams } = useSearchParamUpdater();
  return (
    <div className="display-flex">
      <div className="flex-2">{t("title")}</div>
      <div className="flex-1">
        <Button unstyled type="button" onClick={() => clearQueryParams()}>
          {t("clearAll")}
        </Button>
      </div>
    </div>
  );
}
