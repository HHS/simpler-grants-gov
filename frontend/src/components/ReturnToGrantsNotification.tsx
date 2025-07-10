"use client";

import SessionStorage from "src/services/sessionStorage/sessionStorage";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

export function ReturnToGrantsNotification() {
  const t = useTranslations("returnToGrants");
  const searchParams = useSearchParams();
  const GrantsLink = (
    <div className="display-flex flex-1 tablet:text-right tablet:margin-bottom-0 margin-bottom-3 tablet:padding-top-3 tablet:flex-justify-end">
      <a href="https://grants.gov">{t("message")}</a>
    </div>
  );
  if (searchParams.get("utm_source") === "Grants.gov") {
    SessionStorage.setItem("showLegacySearchReturnNotification", "true");
    return GrantsLink;
  }
  if (SessionStorage.getItem("showLegacySearchReturnNotification") === "true") {
    return GrantsLink;
  }

  return null;
}
