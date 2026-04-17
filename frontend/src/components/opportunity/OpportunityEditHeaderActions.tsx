"use client";

import { useEffect, useState } from "react";
import { Button } from "@trussworks/react-uswds";

import { OpportunityEditFormValues } from "./opportunityEditFormConfig";

type OpportunityEditHeaderActionsProps = {
  initialValues: OpportunityEditFormValues;
  previewLabel: string;
  publishLabel: string;
};

function isPublishEnabled(values: OpportunityEditFormValues): boolean {
  return (
    values.publishDate.trim() !== "" &&
    values.fundingType.trim() !== "" &&
    values.fundingCategories.trim() !== "" &&
    values.eligibleApplicants.length > 0
  );
}

export default function OpportunityEditHeaderActions({
  initialValues,
  previewLabel,
  publishLabel,
}: OpportunityEditHeaderActionsProps) {
  const [publishEnabled, setPublishEnabled] = useState(
    isPublishEnabled(initialValues),
  );

  useEffect(() => {
    const form = document.getElementById(
      "opportunity-edit-form",
    ) as HTMLFormElement | null;
    if (!form) return;

    const check = () => {
      const data = new FormData(form);
      const publishDate = (data.get("publishDate") as string) ?? "";
      const fundingType = (data.get("funding-type-values") as string) ?? "";
      const fundingCategory =
        (data.get("funding-category-values") as string) ?? "";
      const eligibleApplicants = data.getAll("eligibleApplicants");
      setPublishEnabled(
        publishDate.trim() !== "" &&
          fundingType.trim() !== "" &&
          fundingCategory.trim() !== "" &&
          eligibleApplicants.length > 0,
      );
    };

    form.addEventListener("change", check);
    return () => form.removeEventListener("change", check);
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
        disabled={!publishEnabled}
        className="height-auto margin-0 margin-bottom-1 font-sans-sm text-bold line-height-sans-1"
      >
        {publishLabel}
      </Button>
    </>
  );
}
