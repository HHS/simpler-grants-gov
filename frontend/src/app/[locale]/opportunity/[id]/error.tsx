"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import BetaAlert from "src/components/BetaAlert";
import ServerErrorAlert from "src/components/ServerErrorAlert";

export default function OpportunityError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const t = useTranslations("OpportunityListing");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <>
      <BetaAlert />
      <ServerErrorAlert callToAction={t("generic_error_cta")} />
    </>
  );
}
