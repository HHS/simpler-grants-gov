"use client";

import { publishFromOverview } from "src/app/[locale]/(base)/grantor/opportunity/[id]/overview/actions";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Alert, Button } from "@trussworks/react-uswds";

type OverviewButtonsProps = {
  opportunityId: string;
  publishEnabled: boolean;
};

export function OverviewButtons({
  opportunityId,
  publishEnabled,
}: OverviewButtonsProps) {
  const t = useTranslations("OpportunityOverview");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handlePublish = () => {
    setError(null);
    startTransition(async () => {
      const result = await publishFromOverview(opportunityId);
      if (result?.errorMessage) {
        setError(result.errorMessage);
      }
    });
  };

  return (
    <>
      {error && (
        <Alert type="error" heading="Error" headingLevel="h4">
          {error}
        </Alert>
      )}
      <Button type="button" outline disabled>
        {t("labels.previewButton")}
      </Button>
      <Button
        type="button"
        disabled={!publishEnabled || isPending}
        onClick={handlePublish}
        className="margin-left-1"
      >
        {t("labels.publishButton")}
      </Button>
    </>
  );
}
