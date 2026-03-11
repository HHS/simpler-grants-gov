"use client";

import { RelevantAgencyRecord } from "src/types/search/searchFilterTypes";
import { GenericTextInput, GenericTextArea, GenericText, 
  KeyValuePair, GenericSelectInput } from "src/components/GenericFormFields";

import { useTranslations } from "next-intl";
import { Button } from "@trussworks/react-uswds";
import { useState } from 'react';
import { redirect } from "next/navigation";


// Category options
const categoryList: KeyValuePair[] = [
  { key: '1', value: 'Discretionary' },
  { key: '2', value: 'Mandatory' },
  { key: '3', value: 'Continuation' },
  { key: '4', value: 'Earmark' },
  { key: '5', value: 'Other' },
];

// Field level error messages
let oppNbrVldtnError = "";
let oppTitleVldtnError = "";
let agencyVldtnError = "";
let categoryVldtnError = "";
let explanationVldtnError = "";

// Variables to store the field values
let opportunityNumber = "";
let opportunityTitle = "";
let selectedAgencyId = "";
let selectedCategoryId = "";
let categoryExplanation = "";


// ----- Main Form -----
type CreateOpportunityPage1Props = {
  agencyId: string;
  userAgencies: RelevantAgencyRecord[];
}
export const CreateOpportunityPage1 = ({
  agencyId,
  userAgencies,
}: CreateOpportunityPage1Props) => {

  // All labels/text on this page with support for international languages
  const t = useTranslations("CreateOpportunity.CreateOpportunityPage1");
  const oppNbrLabel = t("opportunityNumber");
  const oppNbrDesc = t("opportunityNumberDesc");
  const oppTitleLabel = t("opportunityTitle");
  const oppTitleDesc = t("opportunityTitleDesc");
  const agencyLabel = t("agency")
  const agencyDesc = ""
  const categoryLabel = t("category");
  const categoryDesc = t("categoryDesc");
  const explainLabel = t("categoryExplanation");
  const explainDesc = t("categoryExplanationDesc");
  const charsAllowed40 = t("charactersAllowed40");
  const charsAllowed255 = t("charactersAllowed255");

  // Agencies: sort alphabetically, convert to key-value pairs, set the default
  const sortedAgencies = [...userAgencies].sort((a, b) =>
    a.agency_name.localeCompare(b.agency_name)
  );
  const keyValueList: KeyValuePair[] = sortedAgencies.map(agency => ({
    key: agency.agency_id,
    value: agency.agency_name,
  }));
  keyValueList.forEach((item) => {
    if (item.key === agencyId) {
      selectedAgencyId = agencyId;
    }
  })

  // Category: if Other then show the Explanation field
  const [showExplain, setShowExplain] = useState<boolean>(false);
  const onCategorySelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    selectedCategoryId = e.target.value;
    checkRequiredFields();
    if (selectedCategoryId === "5") {
      setShowExplain(true);
    } else {
      setShowExplain(false);
    }
  };

  // Check required fields to enable the Save button
  const [disableSave, setDisableSave] = useState<boolean>(true);
  const checkRequiredFields = () => {
    if (opportunityNumber.trim().length == 0
      || opportunityTitle.trim().length == 0
      || selectedCategoryId === ""
      || selectedAgencyId === "") {
        setDisableSave(true);
        return;
      }
    // if Category is 'Other' then an Explanation is required
    if (selectedCategoryId === "5") {
      if (categoryExplanation.trim().length == 0) {
        setDisableSave(true);
        return;
      }
    }
    console.log('checkRequiredFields: All requirements met');
    setDisableSave(false);
  }

  // Save values as the user inputs the fields & check for required fields
  const onOppNbrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    opportunityNumber = e.target.value;
    checkRequiredFields();
  };
  const onOppTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    opportunityTitle = e.target.value;
    checkRequiredFields();
  };
  const onAgencySelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    selectedAgencyId = e.target.value;
    checkRequiredFields();
  };
  const onExplanationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    categoryExplanation = e.target.value;
    checkRequiredFields();
  };

  // Custom CSS for the cancel button
  const cancelButtonStyle: React.CSSProperties = {
    backgroundColor: '#f0f0f0',
    color: '#2e8367',
    border: '3px solid #00a398',
    borderBottom: '5px solid #00a398',
    marginRight: '15px',
  };

  // Display the form
  return (
    <>
      <form className="flex-1 margin-top-2 simpler-apply-form">
        <div data-testid="formGroup" className="width-full">

          {/* Opportunity Number */}
          <GenericTextInput
            labelId="label-for-opportunity_number"
            labelText={oppNbrLabel}
            description={oppNbrDesc}
            fieldId="opportunity_number"
            fieldMaxLength={40}
            isRequired={true}
            validationError={oppNbrVldtnError}
            onTextChange={onOppNbrChange}
          />
          <GenericText
            textContent={charsAllowed40}
          />

          {/* Opportunity Title */}
          <GenericTextArea
            labelId="label-for-opportunity_title"
            labelText={oppTitleLabel}
            description={oppTitleDesc}
            fieldId="opportunity_title"
            fieldMaxLength={255}
            isRequired={true}
            validationError={oppTitleVldtnError}
            onTextChange={onOppTitleChange}
          />
          <GenericText
            textContent={charsAllowed255}
          />

          {/* Agency */}
          <GenericSelectInput
            labelId="label-for-agency"
            labelText={agencyLabel}
            description={agencyDesc}
            fieldId="agency"
            isRequired={true}
            listKeyValuePairs={keyValueList}
            defaultSelection={selectedAgencyId}
            validationError={agencyVldtnError}
            onSelectionChange={onAgencySelection}
          />

          {/* Category */}
          <GenericSelectInput
            labelId="label-for-category"
            labelText={categoryLabel}
            description={categoryDesc}
            fieldId="category"
            isRequired={true}
            listKeyValuePairs={categoryList}
            validationError={categoryVldtnError}
            onSelectionChange={onCategorySelection}
          />

          {/* Category-Other Explanation */}
          { showExplain && <GenericTextArea
            labelId="label-for-explanation"
            labelText={explainLabel}
            description={explainDesc}
            fieldId="explanation"
            fieldMaxLength={2000}
            isRequired={true}
            validationError={explanationVldtnError}
            onTextChange={onExplanationChange}
          /> }
          <GenericText
            textContent={charsAllowed255}
          />

        </div>

        <div className="display-flex flex-left margin-top-5">
          <Button 
            onClick={handleCancel}
            type="button" 
            name="cancel-button"
            style={cancelButtonStyle} >
              Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={disableSave}
            type="button" 
            name="save-button">
              Save and continue
          </Button>
        </div>


      </form>
    
    </>    
  )
}


//----- Handle Save and Cancel -----
const handleCancel = () => {
  redirect("/opportunities")
};
const handleSave = () => {
}
