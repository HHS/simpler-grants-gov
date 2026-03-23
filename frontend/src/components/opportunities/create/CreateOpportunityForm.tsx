"use client";

import { createOpportunityAction } from "src/app/[locale]/(base)/opportunities/create/[agencyId]/actions";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { Alert, Button, Link } from "@trussworks/react-uswds";

import {
  CommonSelectInput,
  CommonText,
  CommonTextArea,
  CommonTextInput,
} from "src/components/grantor/CommonFormFields";

// Category options
const categoryList = {
  "discretionary": "Discretionary",
  "mandatory": "Mandatory",
  "continuation": "Continuation",
  "earmark": "Earmark",
  "other": "Other",
};

// ----- Main Form -----
export function CreateOpportunityForm({
  defaultAgencyId,
  userAgencies,
}: {
  defaultAgencyId: string;
  userAgencies: { [key: string]: string };
}) {
  const t = useTranslations("CreateOpportunity.CreateOpportunityForm");
  const tg = useTranslations("CommonLabels");
  const th = useTranslations("CreateOpportunity");

  // Define states for required fields and flags to show/hide or enable/disable components
  const [selectedAgencyId, setAgencyId] = useState<string>(defaultAgencyId);
  const [opportunityNumber, setOppNbr] = useState<string>("");
  const [opportunityTitle, setOppTitle] = useState<string>("");
  const [selectedCategoryId, setCategory] = useState<string>("");
  const [categoryExplanation, setExplain] = useState<string>("");
  const [showExplain, setShowExplain] = useState<boolean>(false);
  const [disableSave, setDisableSave] = useState<boolean>(true);

  const [response, formAction, isPending] = useActionState(createOpportunityAction, {
      validationErrors: {},
    });

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
      if (selectedCategoryId.trim() !== 'other') {
        setExplain('');   // need to manually set this for checks below to work correctly
      }
    }
  }, [response, router]);

  // Use useEffect to check fields when inputs change
  useEffect(() => {
    // Category: if Other then show the Explanation field
    if (selectedCategoryId.trim() === 'other') {
      setShowExplain(true);
    } else {
      setShowExplain(false);
    }
    // Check for required fields to enable the Save button
    const allReqFieldsFilled = 
      opportunityNumber.trim() !== '' &&  
      opportunityTitle.trim() !== '' && 
      selectedAgencyId.trim() !== '' &&
      ( (selectedCategoryId.trim() !== '' && selectedCategoryId.trim() !== 'other') ||
      (selectedCategoryId.trim() === 'other' && categoryExplanation.trim() !== '') )
    ;
    setDisableSave(!allReqFieldsFilled);
  },  // Dependencies: run whenever these fields change
      [opportunityNumber, 
      opportunityTitle, 
      selectedAgencyId, 
      selectedCategoryId, 
      categoryExplanation]
  ); 

  // Update state on change
  const onCategorySelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
  };
  const onOppNbrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOppNbr(e.target.value);
  };
  const onOppTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOppTitle(e.target.value);
  };
  const onAgencySelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAgencyId(e.target.value);
  };
  const onExplanationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setExplain(e.target.value);
  };

  // Display the form
  return (
    <>
      {response?.errorMessage && (
        <Alert heading={tg("errorHeading")} headingLevel="h2" type="error">
          {response?.errorMessage}
        </Alert>
      )}
      {response?.success && (
        <Alert heading={tg("successHeading")} headingLevel="h2" type="success">
          {t("successMessage")}
        </Alert>
      )}

      <h2>{th("keyInfo")}</h2>
      <div className="display-flex flex-justify">
        <div>{th("basicInstructions")}</div>
      </div>

      <form
        action={formAction}
        className="flex-1 margin-top-2 simpler-apply-form"
      >
        <div data-testid="formGroup" className="width-full">
          {/* Opportunity Number */}
          <CommonTextInput
            labelId="label-for-opportunityNumber"
            labelText={t("opportunityNumber")}
            description={t("opportunityNumberDesc")}
            fieldId="opportunityNumber"
            fieldMaxLength={40}
            isRequired={true}
            onTextChange={onOppNbrChange}
            defaultValue={response?.data?.opportunity_number || ""}
          />
          <CommonText textContent={t("charactersAllowed40")} />

          {/* Opportunity Title */}
          <CommonTextArea
            labelId="label-for-opportunityTitle"
            labelText={t("opportunityTitle")}
            description={t("opportunityTitleDesc")}
            fieldId="opportunityTitle"
            fieldMaxLength={255}
            isRequired={true}
            onTextChange={onOppTitleChange}
            defaultValue={response?.data?.opportunity_title || ""}
          />
          <CommonText textContent={t("charactersAllowed255")} />

          {/* Agency */}
          <CommonSelectInput
            labelId="label-for-agencyId"
            labelText={t("agency")}
            description={""}
            fieldId="agencyId"
            isRequired={true}
            listKeyValuePairs={userAgencies}
            defaultSelection={response?.data?.agency_id || selectedAgencyId}
            onSelectionChange={onAgencySelection}
          />

          {/* Category */}
          <CommonSelectInput
            labelId="label-for-category"
            labelText={t("category")}
            description={t("categoryDesc")}
            fieldId="category"
            isRequired={true}
            listKeyValuePairs={categoryList}
            defaultSelection={response?.data?.category || ""}
            onSelectionChange={onCategorySelection}
          />

          {/* Category-Other Explanation */}
          {showExplain && (
            <CommonTextArea
              labelId="label-for-categoryExplanation"
              labelText={t("categoryExplanation")}
              description={t("categoryExplanationDesc")}
              fieldId="categoryExplanation"
              fieldMaxLength={2000}
              isRequired={true}
              onTextChange={onExplanationChange}
              defaultValue={response?.data?.category_explanation || ""}
            />
          )}
          {showExplain && (
            <CommonText textContent={t("charactersAllowed255")} />
          )}
        </div>

        <div className="display-flex flex-left margin-top-5">
          <Link href="/opportunities">
            <Button
              type="button"
              name="cancel_button"
              className="usa-button--outline"
            >
              {tg("cancel")}
            </Button>
          </Link>
          <Button
            disabled={disableSave || isPending}
            type="submit"
            name="save_button"
          >
            {tg(isPending ? "pending" : "saveAndContinue")}
          </Button>
        </div>
      </form>
    </>
  );
}
