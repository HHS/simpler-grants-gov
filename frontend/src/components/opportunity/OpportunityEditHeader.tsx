"use client";

import { submitOpportunityAction } from "src/app/[locale]/(base)/opportunity/[id]/edit/actions";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { Alert, Button } from "@trussworks/react-uswds";

import { OpportunityEditFormValues } from "./opportunityEditFormConfig";

type OpportunityEditHeaderProps = {
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

export default function OpportunityEditHeader({
  initialValues,
  previewLabel,
  publishLabel,
}: OpportunityEditHeaderProps) {
  const t = useTranslations("OpportunityEdit.content.alerts");
  const [publishEnabled, setPublishEnabled] = useState(
    isPublishEnabled(initialValues),
  );
  const [submitState, submitFormAction, isSubmitting] = useActionState(
    submitOpportunityAction,
    {},
  );

  // When submit returns validation errors, route them through the form's useActionState
  // so they display in the form field UI rather than in the header.
  useEffect(() => {
    if (submitState.validationErrors) {
      const form = document.getElementById(
        "opportunity-edit-form",
      ) as HTMLFormElement | null;
      form?.requestSubmit();
    }
  }, [submitState.validationErrors]);

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
      {submitState.errorMessage && (
        <Alert
          type="error"
          headingLevel="h4"
          heading={t("errorHeading")}
          className="margin-bottom-1"
          slim
        >
          {submitState.errorMessage}
        </Alert>
      )}
      <Button
        type="button"
        outline
        disabled
        className="height-auto margin-0 margin-bottom-1 margin-right-105 font-sans-sm text-bold line-height-sans-1"
      >
        {previewLabel}
      </Button>
      <Button
        type="submit"
        form="opportunity-edit-form"
        formAction={submitFormAction}
        disabled={!publishEnabled || isSubmitting}
        className="height-auto margin-0 margin-bottom-1 font-sans-sm text-bold line-height-sans-1"
      >
        {publishLabel}
      </Button>
    </>
  );
}
