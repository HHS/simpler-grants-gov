"use client";

import { createOpportunityAction, validateAgencyAccessAction } from "src/app/[locale]/(base)/opportunities/create/actions";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useState } from "react";
import { Alert, Button, Link } from "@trussworks/react-uswds";

import {
  CommonCharacterCount,
  CommonSelectInput,
} from "src/components/grantor/CommonFormFields";

// Category options
const categoryList = {
  discretionary: "Discretionary",
  mandatory: "Mandatory",
  continuation: "Continuation",
  earmark: "Earmark",
  other: "Other",
};

// ----- Main Form -----
export function CreateOpportunityForm({
  defaultAgencyId,
  userAgencies,
}: {
  defaultAgencyId: string;
  userAgencies: { [key: string]: string };
}) {
  const t = useTranslations("CreateOpportunity");

  // Define states for required fields and flags to show/hide or enable/disable components
  const [selectedAgencyId, setAgencyId] = useState<string>(defaultAgencyId);
  const [opportunityNumber, setOppNbr] = useState<string>("");
  const [opportunityTitle, setOppTitle] = useState<string>("");
  const [selectedCategoryId, setCategory] = useState<string>("");
  const [categoryExplanation, setExplain] = useState<string>("");
  const [assistanceListingNumber, setAssistanceListingNumber] =
    useState<string>("");
  const [agencyAccessError, setAgencyAccessError] = useState<string>("");
  const [showExplain, setShowExplain] = useState<boolean>(false);
  const [disableSave, setDisableSave] = useState<boolean>(true);

  const [response, formAction, isPending] = useActionState(
    createOpportunityAction,
    {
      validationErrors: {},
    },
  );

  // Update validateAgencyAccess function
  const validateAgencyAccess = useCallback(async (agencyId: string) => {
    if (!agencyId) return;
    
    setAgencyAccessError("");
    
    try {
      const result = await validateAgencyAccessAction(agencyId);
      
      if (result.error) {
        setAgencyAccessError(result.error);
      } else {
        setAgencyAccessError("");
      }
    } catch (_error) {
      setAgencyAccessError(t("CreateOpportunityForm.agencyAccessError"));
    }
  }, [t]);

  // Use useEffect to detect success and redirect
  const router = useRouter();
  useEffect(() => {
    // Scroll to top for the error or success message
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    // If success, redirect to Opportunity List page
    if (response?.success) {
      router.push("/opportunities");
    } else {
      setDisableSave(true);
      if (selectedCategoryId.trim() !== "other") {
        setExplain(""); // need to manually set this for checks below to work correctly
      }
    }
  }, [response, router]);

  // Use useEffect to check fields when inputs change
  useEffect(
    () => {
      // Category: if Other then show the Explanation field
      if (selectedCategoryId.trim() === "other") {
        setShowExplain(true);
      } else {
        setShowExplain(false);
      }
      // Check for required fields to enable the Save button
      const allReqFieldsFilled =
        opportunityNumber.trim() !== "" &&
        opportunityTitle.trim() !== "" &&
        assistanceListingNumber.trim() !== "" &&
        selectedAgencyId.trim() !== "" &&
        !agencyAccessError && // Disable Save and Continue if there's an agency access error
        ((selectedCategoryId.trim() !== "" &&
          selectedCategoryId.trim() !== "other") ||
          (selectedCategoryId.trim() === "other" &&
            categoryExplanation.trim() !== ""));
      setDisableSave(!allReqFieldsFilled);
    }, // Dependencies: run whenever these fields change
    [
      opportunityNumber,
      opportunityTitle,
      selectedAgencyId,
      selectedCategoryId,
      categoryExplanation,
      assistanceListingNumber,
      agencyAccessError,
    ],
  );

  // Validate the user's agency access on drop down selection
  useEffect(() => {
    if (defaultAgencyId) {
      validateAgencyAccess(defaultAgencyId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultAgencyId]);

  // Update state on change
  const onOppNbrChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOppNbr(e.target.value);
  };
  const onOppTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOppTitle(e.target.value);
  };
  const onAgencySelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAgencyId(e.target.value);
    validateAgencyAccess(e.target.value);
  };
  const onCategorySelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
  };
  const onExplanationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setExplain(e.target.value);
  };
  const onAlnChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAssistanceListingNumber(e.target.value);
  };

  // Display the form
  return (
    <>
      {response?.errorMessage && (
        <Alert heading={t("errorHeading")} headingLevel="h2" type="error">
          {response?.errorMessage}
        </Alert>
      )}
      {response?.success && (
        <Alert heading={t("successHeading")} headingLevel="h2" type="success">
          {t("CreateOpportunityForm.successMessage")}
        </Alert>
      )}

      {agencyAccessError && (
        <Alert heading={t("errorHeading")} headingLevel="h2" type="error">
          {agencyAccessError}
        </Alert>
      )}

      <h2>{t("keyInfo")}</h2>
      <div className="display-flex flex-justify">
        <div>{t("basicInstructions")}</div>
      </div>

      <form
        action={formAction}
        className="flex-1 margin-top-2 simpler-apply-form"
      >
        <div data-testid="formGroup" className="width-full">
          {/* Opportunity Number */}
          <CommonCharacterCount
            labelText={t("CreateOpportunityForm.opportunityNumber")}
            description={t("CreateOpportunityForm.opportunityNumberDesc")}
            fieldId="opportunityNumber"
            fieldMaxLength={40}
            isRequired={true}
            onTextChange={onOppNbrChange}
            defaultValue={response?.data?.opportunity_number || ""}
          />

          {/* Opportunity Title */}
          <CommonCharacterCount
            isTextArea={true}
            labelText={t("CreateOpportunityForm.opportunityTitle")}
            description={t("CreateOpportunityForm.opportunityTitleDesc")}
            fieldId="opportunityTitle"
            fieldMaxLength={255}
            isRequired={true}
            onTextChange={onOppTitleChange}
            defaultValue={response?.data?.opportunity_title || ""}
          />

          {/* Agency */}
          <CommonSelectInput
            labelText={t("CreateOpportunityForm.agency")}
            description={""}
            fieldId="agencyId"
            isRequired={true}
            listKeyValuePairs={userAgencies}
            defaultSelection={response?.data?.agency_id || selectedAgencyId}
            onSelectionChange={onAgencySelection}
          />

          {/* Category */}
          <CommonSelectInput
            labelText={t("CreateOpportunityForm.category")}
            description={t("CreateOpportunityForm.categoryDesc")}
            fieldId="category"
            isRequired={true}
            listKeyValuePairs={categoryList}
            defaultSelection={response?.data?.category || ""}
            onSelectionChange={onCategorySelection}
          />

          {/* Category-Other Explanation */}
          {showExplain && (
            <CommonCharacterCount
              isTextArea={true}
              labelText={t("CreateOpportunityForm.categoryExplanation")}
              description={t("CreateOpportunityForm.categoryExplanationDesc")}
              fieldId="categoryExplanation"
              fieldMaxLength={255}
              isRequired={true}
              onTextChange={onExplanationChange}
              defaultValue={response?.data?.category_explanation || ""}
            />
          )}

          {/* Assistance Listing Number (ALN) */}
          <CommonCharacterCount
            labelText={t("CreateOpportunityForm.assistanceListingNumber")}
            description={t("CreateOpportunityForm.assistanceListingNumberDesc")}
            fieldId="assistanceListingNumber"
            fieldMaxLength={6}
            isRequired={true}
            onTextChange={onAlnChange}
            defaultValue={response?.data?.assistance_listing_number || ""}
          />
        </div>

        <div className="display-flex flex-left margin-top-5">
          <Link href="/opportunities">
            <Button
              type="button"
              name="cancel_button"
              className="usa-button--outline"
            >
              {t("cancel")}
            </Button>
          </Link>
          <Button
            disabled={disableSave || isPending}
            type="submit"
            name="save_button"
          >
            {t(isPending ? "pending" : "saveAndContinue")}
          </Button>
        </div>
      </form>
    </>
  );
}
