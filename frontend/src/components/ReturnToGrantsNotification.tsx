"use client";

import { environment } from "src/constants/environments";
import SessionStorage from "src/services/sessionStorage/sessionStorage";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

export function ReturnToGrantsNotification() {
  const t = useTranslations("returnToGrants");
  const searchParams = useSearchParams();
  const GrantsLink = <a href={environment.LEGACY_HOST}>{t("message")}</a>;
  if (searchParams.get("utm_source") === "Grants.gov") {
    SessionStorage.setItem("showLegacySearchReturnNotification", "true");
    return GrantsLink;
  }
  if (SessionStorage.getItem("showLegacySearchReturnNotification") === "true") {
    return GrantsLink;
  }

  return null;
}
