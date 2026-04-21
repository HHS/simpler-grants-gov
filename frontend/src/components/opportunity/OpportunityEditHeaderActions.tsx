"use client";

import { publishOpportunityAction } from "src/app/[locale]/(base)/opportunity/[id]/edit/actions";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@trussworks/react-uswds";

import { OpportunityEditFormValues } from "./opportunityEditFormConfig";

type OpportunityEditHeaderActionsProps = {
  opportunityId: string;
  initialValues: OpportunityEditFormValues;
  previewLabel: string;
  publishLabel: string;
};

function isValidDate(str: string): boolean {
  if (!str.trim()) return false;
  return !isNaN(new Date(str).getTime());
}

function isPublishEnabled(values: OpportunityEditFormValues): boolean {
  return (
    values.publishDate.trim() !== "" &&
    values.fundingType.trim() !== "" &&
    values.fundingCategories.trim() !== "" &&
    values.eligibleApplicants.length > 0
  );
}

export default function OpportunityEditHeaderActions({
  opportunityId,
  initialValues,
  previewLabel,
  publishLabel,
}: OpportunityEditHeaderActionsProps) {
  const [publishEnabled, setPublishEnabled] = useState(
    isPublishEnabled(initialValues),
  );
  const [currentPublishDate, setCurrentPublishDate] = useState(
    initialValues.publishDate,
  );
  const [isPublishing, setIsPublishing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const form = document.getElementById("opportunity-edit-form");
    if (!form) return;

    const check = (e: Event) => {
      const {
        publishDate,
        fundingType,
        fundingCategories,
        eligibleApplicants,
      } = (
        e as CustomEvent<{
          publishDate: string;
          fundingType: string;
          fundingCategories: string;
          eligibleApplicants: string[];
        }>
      ).detail;
      setCurrentPublishDate(publishDate);
      setPublishEnabled(
        publishDate.trim() !== "" &&
          fundingType.trim() !== "" &&
          fundingCategories.trim() !== "" &&
          eligibleApplicants.length > 0,
      );
    };

    form.addEventListener("opportunity-values-change", check);
    return () => form.removeEventListener("opportunity-values-change", check);
  }, []);

  return (
    <>
      <Button
        type="button"
        outline
        disabled
        className="height-auto margin-0 margin-bottom-1 margin-right-105 font-sans-sm text-bold line-height-sans-1"
      >
        {previewLabel}
      </Button>
      <Button
        type="button"
        disabled={!publishEnabled || isPublishing}
        className="height-auto margin-0 margin-bottom-1 font-sans-sm text-bold line-height-sans-1"
        onClick={() => {
          if (!isValidDate(currentPublishDate)) {
            const form = document.getElementById(
              "opportunity-edit-form",
            ) as HTMLFormElement | null;
            form?.requestSubmit();
            return;
          }
          setIsPublishing(true);
          publishOpportunityAction(opportunityId)
            .then((result) => {
              if (result?.errorMessage) {
                setIsPublishing(false);
              } else {
                router.push("/opportunities");
              }
            })
            .catch((_e) => setIsPublishing(false));
        }}
      >
        {publishLabel}
      </Button>
    </>
  );
}
