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
  KeyValuePair,
} from "./CreateOpportunityFormFields";

// Category options
const categoryList: KeyValuePair[] = [
  { key: "discretionary", value: "Discretionary" },
  { key: "mandatory", value: "Mandatory" },
  { key: "continuation", value: "Continuation" },
  { key: "earmark", value: "Earmark" },
  { key: "other", value: "Other" },
];

// ----- Main Form -----
export function CreateOpportunityForm({
  defaultAgencyId,
  userAgencies,
}: {
  defaultAgencyId: string;
  userAgencies: KeyValuePair[];
}) {
  const t = useTranslations("CreateOpportunity.CreateOpportunityForm");
  const tg = useTranslations("CommonLabels");
  const th = useTranslations("CreateOpportunity");
  const [disableSave, setDisableSave] = useState<boolean>(true);

  const [response, formAction, isPending] = useActionState(
    createOpportunityAction,
    {
      validationErrors: {},
    },
  );

  // Use useEffect to detect success and redirect
  const router = useRouter();
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // Smooth scrolling animation
    });
    if (response?.success) {
      router.push("/opportunities");
    } else {
      setDisableSave(true); // on text change does not seem to reset this?
    }
  }, [response, router]);

  // Variables to store the form field values. Needed in order to check
  // required fields (on individual field value change) to enable the Save button.
  let opportunityNumber = "";
  let opportunityTitle = "";
  let selectedAgencyId = defaultAgencyId;
  let selectedCategoryId = "";
  let categoryExplanation = "";

  // Form fields that we will need to check -- NOTE: this only sets the fields after
  // code execution, i.e. on DOM refresh
  // const [selectedAgencyId, setAgencyId] = useState<string>(defaultAgencyId);
  // const [opportunityNumber, setOppNbr] = useState<string>("");
  // const [opportunityTitle, setOppTitle] = useState<string>("");
  // const [selectedCategoryId, setCategory] = useState<string>("");
  // const [category_explanation, setExplain] = useState<string>("");

  // Category: if Other then show the Explanation field
  const [showExplain, setShowExplain] = useState<boolean>(false);
  const onCategorySelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // console.log("DEBUG: e.target.value is ", e.target.value);
    // setCategory(e.target.value);
    selectedCategoryId = e.target.value;
    // console.log("DEBUG: category is ", selectedCategoryId);   // is still old value w/ useState()
    checkRequiredFields();
    if (selectedCategoryId === "other") {
      setShowExplain(true);
    } else {
      setShowExplain(false);
    }
  };

  // Check required fields to enable the Save button
  // const [disableSave, setDisableSave] = useState<boolean>(true);
  const checkRequiredFields = () => {
    if (
      opportunityNumber.trim().length === 0 ||
      opportunityTitle.trim().length === 0 ||
      selectedCategoryId === "" ||
      selectedAgencyId === ""
    ) {
      setDisableSave(true);
      return;
    }
    // if Category is 'Other' then an Explanation is required
    if (
      selectedCategoryId === "other" &&
      categoryExplanation.trim().length === 0
    ) {
      setDisableSave(true);
      return;
    }
    // console.log('checkRequiredFields: All requirements met');
    setDisableSave(false);
  };

  // Save values as the user inputs the fields & check for required fields
  const onOppNbrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // setOppNbr(e.target.value);
    opportunityNumber = e.target.value;
    checkRequiredFields();
  };
  const onOppTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // setOppTitle(e.target.value);
    opportunityTitle = e.target.value;
    checkRequiredFields();
  };
  const onAgencySelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // setAgencyId(e.target.value);
    selectedAgencyId = e.target.value;
    checkRequiredFields();
  };
  const onExplanationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // setExplain(e.target.value);
    categoryExplanation = e.target.value;
    checkRequiredFields();
  };

  // Display the form
  return (
    <>
      {response?.errorMessage && (
        <Alert
          heading={tg("errorHeading")}
          headingLevel="h2"
          type="error"
          validation
        >
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
