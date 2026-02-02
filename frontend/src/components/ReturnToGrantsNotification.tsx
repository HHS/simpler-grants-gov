"use client";

import SessionStorage from "src/services/sessionStorage/sessionStorage";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

export function ReturnToGrantsNotification({
  legacyLink,
}: {
  legacyLink: string;
}) {
  const t = useTranslations("returnToGrants");
  const searchParams = useSearchParams();
  const GrantsLink = <a href={legacyLink}>{t("message")}</a>;
  if (searchParams.get("utm_source") === "Grants.gov") {
    SessionStorage.setItem("showLegacySearchReturnNotification", "true");
    return GrantsLink;
  }
  if (SessionStorage.getItem("showLegacySearchReturnNotification") === "true") {
    return GrantsLink;
  }

  return null;
}
