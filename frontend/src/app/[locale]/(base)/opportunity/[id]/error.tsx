"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import GeneralErrorAlert from "src/components/core/GeneralErrorAlert";

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
      <GeneralErrorAlert callToAction={t("genericErrorCta")} />
    </>
  );
}
