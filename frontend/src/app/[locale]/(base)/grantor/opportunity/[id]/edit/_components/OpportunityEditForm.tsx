"use client";

import { OpportunityAttachmentUploadInput } from "src/app/[locale]/(base)/grantor/opportunity/[id]/edit/_components/OpportunityAttachmentUploadInput";
import {
  opportunityEditFormAction,
  type OpportunityEditValidationErrors,
} from "src/app/[locale]/(base)/grantor/opportunity/[id]/edit/actions";
import {
  categoryOptions,
  eligbilityValueToGroup,
  ELIGIBILITY_OPTIONS,
  fundingOptions,
} from "src/constants/opportunity";
import { OpportunityAttachment } from "src/types/opportunity/opportunityAttachmentTypes";
import { getNumericAmountFromString } from "src/utils/formatCurrencyUtil";
import { OpportunityEditFormValues } from "src/utils/opportunityEditFormConfig";

import { useTranslations } from "next-intl";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  ErrorMessage,
  Fieldset,
  FormGroup,
  Radio,
  Select,
  Textarea,
  TextInput,
} from "@trussworks/react-uswds";

import { CommonCharacterCount } from "src/components/core/forms/CommonFormFields";
import { DynamicFieldLabel } from "src/components/core/forms/DynamicFieldLabel";

function formatNumber(value: string): string {
  const raw = value.replace(/,/g, "");
  if (!raw || isNaN(Number(raw))) return value;
  return Number(raw).toLocaleString("en-US");
}

const eligibilityDisplayLabels: Record<string, string> = Object.fromEntries(
  ELIGIBILITY_OPTIONS.map(({ value, label }) => [value, label]),
);

type EligibilityCheckboxGroupProps = {
  title: string;
  options: typeof ELIGIBILITY_OPTIONS;
  baseId: string;
  initialSelectedValues: string[];
  onToggle: (value: string) => void;
  disabled: boolean;
};

function EligibilityCheckboxGroup({
  title,
  options,
  baseId,
  initialSelectedValues,
  onToggle,
  disabled,
}: EligibilityCheckboxGroupProps) {
  return (
    <Fieldset className="margin-top-0 margin-bottom-4">
      <div className="font-sans-sm text-bold margin-bottom-1">{title}</div>
      <div className="display-flex flex-column">
        {options.map((option, index) => (
          <div key={option.value} className="padding-top-05">
            <Checkbox
              id={`${baseId}-${index}`}
              name="eligibleApplicants"
              value={option.value}
              label={eligibilityDisplayLabels[option.value] ?? option.label}
              defaultChecked={initialSelectedValues.includes(option.value)}
              onChange={() => onToggle(option.value)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </Fieldset>
  );
}

type OpportunityEditFormProps = {
  opportunityId: string;
  opportunitySummaryId: string;
  isForecast?: boolean;
  initialValues: OpportunityEditFormValues;
  isDraft?: boolean;
  initialAttachments?: OpportunityAttachment[];
};

export default function OpportunityEditForm({
  opportunityId,
  opportunitySummaryId,
  isForecast = false,
  initialValues,
  isDraft = false,
  initialAttachments = [],
}: OpportunityEditFormProps) {
  const t = useTranslations("OpportunityEdit");
  const formRef = useRef<HTMLFormElement>(null);
  const [currentSummaryId, setCurrentSummaryId] =
    useState(opportunitySummaryId);

  // State for fields that drive conditional show/hide rendering and
  // the publish button enabled state.
  const [fundingCategory, setFundingCategory] = useState(
    initialValues.fundingCategories,
  );
  const [closeDate, setCloseDate] = useState(initialValues.closeDate);
  const [selectedEligibility, setSelectedEligibility] = useState<string[]>(
    initialValues.eligibleApplicants,
  );
  const [formState, formAction] = useActionState(opportunityEditFormAction, {
    validationErrors: {},
  });

  const validationErrors: OpportunityEditValidationErrors | undefined =
    formState.validationErrors;

  //--- Validations for Award Minimum, Award Maximum and Total Program Funding ---
  const [frontendErrors, setFrontendErrors] =
    useState<OpportunityEditValidationErrors>({});

  function setSingleFrontendError<
    K extends keyof OpportunityEditValidationErrors,
  >(fieldname: K, error: string | null) {
    if (!error) {
      // clear the list of errors for this field
      setFrontendErrors((currentValues) => ({
        ...currentValues,
        [fieldname]: [],
      }));
    } else {
      setFrontendErrors((currentValues) => ({
        ...currentValues,
        [fieldname]: [error],
      }));
    }
  }

  const singleFieldValidation = (event: React.FocusEvent<HTMLInputElement>) => {
    const form = event.currentTarget.form;
    if (!form) return;
    const formData = new FormData(form);
    const estTotalFunding = getNumericAmountFromString(
      formData.get("estimatedTotalProgramFunding") as string | null,
    );
    const awardMin = getNumericAmountFromString(
      formData.get("awardMinimum") as string | null,
    );
    const awardMax = getNumericAmountFromString(
      formData.get("awardMaximum") as string | null,
    );
    // clear old error messages
    setSingleFrontendError("awardMinimum", null);
    setSingleFrontendError("awardMaximum", null);
    setSingleFrontendError("estimatedTotalProgramFunding", null);
    const maxLimit = 1000000000000000;

    //--- min & max values for Award Minimum, Award Minimum and Total Program Funding ---
    if (awardMin < 0 || awardMin >= maxLimit) {
      const errMsg = t("validationErrors.awardMinCurrencyInput");
      setSingleFrontendError("awardMinimum", errMsg);
    }
    if (awardMax < 0 || awardMax >= maxLimit) {
      const errMsg = t("validationErrors.awardMaxCurrencyInput");
      setSingleFrontendError("awardMaximum", errMsg);
    }
    if (estTotalFunding < 0 || estTotalFunding >= maxLimit) {
      const errMsg = t("validationErrors.totalFundingCurrencyInput");
      setSingleFrontendError("estimatedTotalProgramFunding", errMsg);
    }
  };

  // Shared toggle handler for eligibility checkboxes.
  function handleEligibilityToggle(value: string) {
    const next = selectedEligibility.includes(value)
      ? selectedEligibility.filter((v) => v !== value)
      : [...selectedEligibility, value];
    setSelectedEligibility(next);
  }

  function getFieldError(
    fieldName: keyof OpportunityEditValidationErrors,
  ): string | undefined {
    let fieldErrors = validationErrors?.[fieldName];
    if (!fieldErrors) {
      fieldErrors = frontendErrors?.[fieldName];
    }
    return fieldErrors?.join(" ");
  }

  useEffect(() => {
    if (formState.newOpportunitySummaryId) {
      // TODO #9633
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentSummaryId(formState.newOpportunitySummaryId);
    }
  }, [formState.newOpportunitySummaryId]);

  const eligibilityGroups = ELIGIBILITY_OPTIONS.reduce(
    (acc, { label, value }) => {
      const group = eligbilityValueToGroup[value];
      if (!acc[group]) acc[group] = [];
      acc[group].push({ label, value });
      return acc;
    },
    {} as Record<string, { label: string; value: string }[]>,
  );

  // CommonCharacterCount fields use onTextChange={() => {}} because they are uncontrolled:
  // values are read from FormData on submit, not tracked in React state.
  return (
    <form
      ref={formRef}
      id="opportunity-edit-form"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.set("submitType", "saveAndExit");
        startTransition(() => formAction(formData));
      }}
      noValidate
    >
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <input
        type="hidden"
        name="opportunitySummaryId"
        value={currentSummaryId}
      />
      <input
        type="hidden"
        name="isForecast"
        data-testid="isForecast-input"
        value={isForecast ? "true" : "false"}
      />
      <input type="hidden" name="title" value={initialValues.title} />
      <input
        type="hidden"
        name="awardSelectionMethod"
        value={initialValues.awardSelectionMethod}
      />

      {!isDraft ? (
        <div className="margin-top-2">
          <Alert type="warning" headingLevel="h3" noIcon>
            {t("content.draftOnlyWarning")}
          </Alert>
        </div>
      ) : null}

      {formState.errorMessage ? (
        <div className="margin-top-2">
          <Alert
            type="warning"
            heading={formState.errorMessage}
            headingLevel="h3"
            validation
          />
        </div>
      ) : null}

      {formState.successMessage ? (
        <div className="margin-top-2">
          <Alert
            type="success"
            heading={formState.successMessage}
            headingLevel="h3"
            noIcon
          >
            {t("content.alerts.successBody")}
          </Alert>
        </div>
      ) : null}

      {formState.validationErrors &&
      Object.keys(formState.validationErrors).length > 0 ? (
        <div className="margin-top-2">
          <Alert
            type="error"
            heading={t("content.alerts.validationErrorHeading")}
            headingLevel="h3"
          >
            <span className="display-block margin-top-1 margin-bottom-1">
              {t("content.alerts.validationErrorBody")}
            </span>
            {Array.from(
              new Set(Object.values(formState.validationErrors).flat()),
            ).map((error, i) => (
              <span key={i} className="display-block">
                {error}
              </span>
            ))}
          </Alert>
        </div>
      ) : null}

      <section
        id="funding-details"
        className="margin-top-4 simpler-page-anchor-offset"
      >
        <h2 className="margin-top-0 margin-bottom-4 font-heading-xl">
          {t("sections.fundingDetails")}
        </h2>
        <p className="margin-top-0 margin-bottom-4 font-sans-lg text-base-dark">
          {t("content.fundingDetailsIntro")}
        </p>

        <div className="display-flex flex-column gap-3">
          <div className="grid-row grid-gap-lg">
            <div className="tablet:grid-col-6">
              <FormGroup error={!!getFieldError("fundingType")}>
                <DynamicFieldLabel
                  idFor="funding-type-values"
                  title={t("labels.fundingType")}
                  required
                  description={t("content.fundingTypeHint")}
                />
                {getFieldError("fundingType") ? (
                  <ErrorMessage>{getFieldError("fundingType")}</ErrorMessage>
                ) : null}
                <Select
                  id="funding-type-values"
                  name="funding-type-values"
                  defaultValue={initialValues.fundingType}
                  className="width-full"
                  disabled={!isDraft}
                >
                  <option value="">{t("content.select")}</option>
                  {fundingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormGroup>
            </div>
            <div className="tablet:grid-col-6">
              <FormGroup>
                <DynamicFieldLabel
                  idFor="cost-sharing-yes"
                  title={t("labels.costSharing")}
                  description={t("content.costSharingHint")}
                />
                <div className="grid-row">
                  <div className="grid-col-6">
                    <Radio
                      id="cost-sharing-yes"
                      name="costSharing"
                      label={t("labels.yes")}
                      value="true"
                      defaultChecked={initialValues.costSharing === true}
                      disabled={!isDraft}
                    />
                  </div>
                  <div className="grid-col-6">
                    <Radio
                      id="cost-sharing-no"
                      name="costSharing"
                      label={t("labels.no")}
                      value="false"
                      defaultChecked={initialValues.costSharing === false}
                      disabled={!isDraft}
                    />
                  </div>
                </div>
              </FormGroup>
            </div>
          </div>

          <div className="grid-row grid-gap-lg">
            <div className="tablet:grid-col-6">
              <FormGroup error={!!getFieldError("fundingCategory")}>
                <DynamicFieldLabel
                  idFor="funding-category-values"
                  title={t("labels.category")}
                  required
                  description={t("content.categoryHint")}
                />
                {getFieldError("fundingCategory") ? (
                  <ErrorMessage>
                    {getFieldError("fundingCategory")}
                  </ErrorMessage>
                ) : null}
                <Select
                  id="funding-category-values"
                  name="funding-category-values"
                  value={fundingCategory}
                  onChange={(event) => {
                    setFundingCategory(event.target.value);
                  }}
                  className="width-full"
                  disabled={!isDraft}
                >
                  <option value="">{t("content.selectFundingCategory")}</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormGroup>
            </div>
          </div>

          {fundingCategory === "other" && (
            <div className="width-full">
              <CommonCharacterCount
                isTextArea={true}
                labelText={t("labels.fundingCategoryExplanation")}
                description={t("content.fundingCategoryExplanationHint")}
                fieldId="fundingCategoryExplanation"
                fieldMaxLength={2500}
                isRequired={false}
                defaultValue={initialValues.fundingCategoryExplanation}
                onTextChange={() => {}}
                disabled={!isDraft}
              />
            </div>
          )}

          <div className="grid-row grid-gap-lg">
            <div className="tablet:grid-col-6">
              <FormGroup error={!!getFieldError("expectedNumberOfAwards")}>
                <DynamicFieldLabel
                  idFor="expected-number-of-awards"
                  title={t("labels.expectedNumberOfAwards")}
                  description={t("content.expectedNumberOfAwardsHint")}
                />
                {getFieldError("expectedNumberOfAwards") ? (
                  <ErrorMessage>
                    {getFieldError("expectedNumberOfAwards")}
                  </ErrorMessage>
                ) : null}
                <TextInput
                  id="expected-number-of-awards"
                  name="expectedNumberOfAwards"
                  type="text"
                  defaultValue={initialValues.expectedNumberOfAwards}
                  className="width-full"
                  disabled={!isDraft}
                />
              </FormGroup>
            </div>
            <div className="tablet:grid-col-6">
              <FormGroup
                error={!!getFieldError("estimatedTotalProgramFunding")}
              >
                <DynamicFieldLabel
                  idFor="estimated-total-program-funding"
                  title={t("labels.estimatedTotalProgramFunding")}
                  description={t("content.estimatedTotalProgramFundingHint")}
                />
                {getFieldError("estimatedTotalProgramFunding") ? (
                  <ErrorMessage>
                    {getFieldError("estimatedTotalProgramFunding")}
                  </ErrorMessage>
                ) : null}
                <TextInput
                  id="estimated-total-program-funding"
                  name="estimatedTotalProgramFunding"
                  type="text"
                  defaultValue={formatNumber(
                    initialValues.estimatedTotalProgramFunding,
                  )}
                  onBlur={singleFieldValidation}
                  className="width-full"
                  disabled={!isDraft}
                />
              </FormGroup>
            </div>
          </div>

          <div className="grid-row grid-gap-lg">
            <div className="tablet:grid-col-6">
              <FormGroup error={!!getFieldError("awardMinimum")}>
                <DynamicFieldLabel
                  idFor="award-minimum"
                  title={t("labels.awardMinimum")}
                  description={t("content.awardMinimumHint")}
                />
                {getFieldError("awardMinimum") ? (
                  <ErrorMessage>{getFieldError("awardMinimum")}</ErrorMessage>
                ) : null}
                <TextInput
                  id="award-minimum"
                  name="awardMinimum"
                  type="text"
                  defaultValue={formatNumber(initialValues.awardMinimum)}
                  onBlur={singleFieldValidation}
                  className="width-full"
                  disabled={!isDraft}
                />
              </FormGroup>
            </div>
            <div className="tablet:grid-col-6">
              <FormGroup error={!!getFieldError("awardMaximum")}>
                <DynamicFieldLabel
                  idFor="award-maximum"
                  title={t("labels.awardMaximum")}
                  description={t("content.awardMaximumHint")}
                />
                {getFieldError("awardMaximum") ? (
                  <ErrorMessage>{getFieldError("awardMaximum")}</ErrorMessage>
                ) : null}
                <TextInput
                  id="award-maximum"
                  name="awardMaximum"
                  type="text"
                  defaultValue={formatNumber(initialValues.awardMaximum)}
                  onBlur={singleFieldValidation}
                  className="width-full"
                  disabled={!isDraft}
                />
              </FormGroup>
            </div>
          </div>

          <div className="grid-row grid-gap-lg">
            <div className="tablet:grid-col-6">
              <FormGroup error={!!getFieldError("publishDate")}>
                <DynamicFieldLabel
                  idFor="publish-date"
                  title={t("labels.publishDate")}
                  required
                  description={t("content.publishDateHint")}
                />
                {getFieldError("publishDate") ? (
                  <ErrorMessage>{getFieldError("publishDate")}</ErrorMessage>
                ) : null}
                <DatePicker
                  id="publish-date"
                  name="publishDate"
                  defaultValue={initialValues.publishDate}
                  placeholder="mm/dd/yyyy"
                  className="width-full"
                  disabled={!isDraft}
                />
              </FormGroup>
            </div>
            <div className="tablet:grid-col-6">
              <FormGroup error={!!getFieldError("closeDate")}>
                <DynamicFieldLabel
                  idFor="close-date"
                  title={t("labels.closeDate")}
                  description={t("content.closeDateHint")}
                />
                {getFieldError("closeDate") ? (
                  <ErrorMessage>{getFieldError("closeDate")}</ErrorMessage>
                ) : null}
                <DatePicker
                  id="close-date"
                  name="closeDate"
                  defaultValue={initialValues.closeDate}
                  placeholder="mm/dd/yyyy"
                  onChange={(value) => setCloseDate(value ?? "")}
                  className="width-full"
                  disabled={!isDraft}
                />
              </FormGroup>
            </div>
          </div>

          {!closeDate && (
            <div className="width-full">
              <FormGroup>
                <DynamicFieldLabel
                  idFor="close-date-explanation"
                  title={t("labels.closeDateExplanation")}
                  description={t("content.closeDateExplanationHint")}
                />
                <Textarea
                  id="close-date-explanation"
                  name="closeDateExplanation"
                  defaultValue={initialValues.closeDateExplanation}
                  rows={5}
                  className="width-full"
                  disabled={!isDraft}
                />
              </FormGroup>
            </div>
          )}
        </div>
      </section>

      <section
        id="eligibility"
        className="margin-top-4 padding-bottom-4 border-bottom border-base-light simpler-page-anchor-offset"
      >
        <div className="display-flex flex-column gap-2 margin-bottom-4">
          <h2 className="margin-0 font-heading-xl">
            {t("sections.eligibility")}
          </h2>
          <p className="margin-0 font-sans-lg text-base-dark maxw-full">
            {t("content.eligibilityIntro")}
          </p>
        </div>

        <div className="display-flex flex-column gap-3">
          <FormGroup error={!!getFieldError("eligibleApplicants")}>
            <DynamicFieldLabel
              idFor="eligible-applicants-values"
              title={t("labels.eligibleApplicants")}
              required
              description={t("content.eligibleApplicantsHint")}
            />
            {getFieldError("eligibleApplicants") ? (
              <ErrorMessage>{getFieldError("eligibleApplicants")}</ErrorMessage>
            ) : null}
          </FormGroup>

          <div className="grid-row grid-gap-xl margin-top-4">
            <div className="tablet:grid-col-6">
              <div>
                <EligibilityCheckboxGroup
                  title={t("labels.eligibilityBusiness")}
                  options={eligibilityGroups.business}
                  baseId="eligible-business"
                  initialSelectedValues={initialValues.eligibleApplicants}
                  onToggle={handleEligibilityToggle}
                  disabled={!isDraft}
                />
                <EligibilityCheckboxGroup
                  title={t("labels.eligibilityEducation")}
                  options={eligibilityGroups.education}
                  baseId="eligible-education"
                  initialSelectedValues={initialValues.eligibleApplicants}
                  onToggle={handleEligibilityToggle}
                  disabled={!isDraft}
                />
                <EligibilityCheckboxGroup
                  title={t("labels.eligibilityGovernment")}
                  options={eligibilityGroups.government}
                  baseId="eligible-government"
                  initialSelectedValues={initialValues.eligibleApplicants}
                  onToggle={handleEligibilityToggle}
                  disabled={!isDraft}
                />
              </div>
            </div>
            <div className="tablet:grid-col-6">
              <div>
                <EligibilityCheckboxGroup
                  title={t("labels.eligibilityNonprofit")}
                  options={eligibilityGroups.nonprofit}
                  baseId="eligible-nonprofit"
                  initialSelectedValues={initialValues.eligibleApplicants}
                  onToggle={handleEligibilityToggle}
                  disabled={!isDraft}
                />
                <EligibilityCheckboxGroup
                  title={t("labels.eligibilityMiscellaneous")}
                  options={eligibilityGroups.miscellaneous}
                  baseId="eligible-misc"
                  initialSelectedValues={initialValues.eligibleApplicants}
                  onToggle={handleEligibilityToggle}
                  disabled={!isDraft}
                />
              </div>
            </div>
          </div>

          {(selectedEligibility.includes("other") ||
            selectedEligibility.includes("unrestricted")) && (
            <div className="width-full">
              <CommonCharacterCount
                isTextArea={true}
                labelText={t("labels.additionalEligibilityInfo")}
                description={t("content.additionalEligibilityInfoHint")}
                fieldId="additionalEligibilityInfo"
                fieldMaxLength={4000}
                isRequired={false}
                defaultValue={initialValues.additionalEligibilityInfo}
                onTextChange={() => {}}
                rawErrors={
                  getFieldError("additionalEligibilityInfo")
                    ? [getFieldError("additionalEligibilityInfo") as string]
                    : []
                }
                disabled={!isDraft}
              />
            </div>
          )}
        </div>
      </section>

      <section
        id="additional-information"
        className="margin-top-4 padding-bottom-4 border-bottom border-base-light simpler-page-anchor-offset"
      >
        <div className="display-flex flex-column gap-2 margin-bottom-4">
          <h2 className="margin-0 font-heading-xl">
            {t("sections.additionalInformation")}
          </h2>
          <p className="margin-0 font-sans-lg text-base-dark maxw-full">
            {t("content.additionalInformationIntro")}
          </p>
        </div>

        <div className="display-flex flex-column gap-2">
          <div className="width-full">
            <CommonCharacterCount
              isTextArea={true}
              labelText={t("labels.description")}
              description={t("content.descriptionHint")}
              fieldId="description"
              fieldMaxLength={1800}
              isRequired={false}
              defaultValue={initialValues.description}
              onTextChange={() => {}}
              rawErrors={
                getFieldError("description")
                  ? [getFieldError("description") as string]
                  : []
              }
              disabled={!isDraft}
            />
          </div>

          <div className="grid-row grid-gap-lg">
            <div className="tablet:grid-col-6">
              <CommonCharacterCount
                inputType="url"
                labelText={t("labels.additionalInfoUrl")}
                description={t("content.additionalInfoUrlHint")}
                fieldId="additionalInfoUrl"
                fieldMaxLength={250}
                isRequired={false}
                defaultValue={initialValues.additionalInfoUrl}
                onTextChange={() => {}}
                rawErrors={
                  getFieldError("additionalInfoUrl")
                    ? [getFieldError("additionalInfoUrl") as string]
                    : []
                }
                disabled={!isDraft}
              />
            </div>
            <div className="tablet:grid-col-6">
              <CommonCharacterCount
                labelText={t("labels.additionalInfoUrlText")}
                description={t("content.additionalInfoUrlTextHint")}
                fieldId="additionalInfoUrlText"
                fieldMaxLength={250}
                isRequired={false}
                defaultValue={initialValues.additionalInfoUrlText}
                onTextChange={() => {}}
                rawErrors={
                  getFieldError("additionalInfoUrlText")
                    ? [getFieldError("additionalInfoUrlText") as string]
                    : []
                }
                disabled={!isDraft}
              />
            </div>
          </div>

          <div className="width-full">
            <CommonCharacterCount
              isTextArea={true}
              labelText={t("labels.grantorContactDetails")}
              description={t("content.grantorContactDetailsHint")}
              fieldId="grantorContactDetails"
              fieldMaxLength={1000}
              isRequired={false}
              defaultValue={initialValues.grantorContactDetails}
              onTextChange={() => {}}
              rawErrors={
                getFieldError("grantorContactDetails")
                  ? [getFieldError("grantorContactDetails") as string]
                  : []
              }
              disabled={!isDraft}
            />
          </div>

          <div className="grid-row grid-gap-lg">
            <div className="tablet:grid-col-6">
              <CommonCharacterCount
                inputType="email"
                labelText={t("labels.contactEmail")}
                description={t("content.contactEmailHint")}
                fieldId="contactEmail"
                fieldMaxLength={130}
                isRequired={false}
                defaultValue={initialValues.contactEmail}
                onTextChange={() => {}}
                rawErrors={
                  getFieldError("contactEmail")
                    ? [getFieldError("contactEmail") as string]
                    : []
                }
                disabled={!isDraft}
              />
            </div>
            <div className="tablet:grid-col-6">
              <CommonCharacterCount
                labelText={t("labels.contactEmailText")}
                description={t("content.contactEmailTextHint")}
                fieldId="contactEmailText"
                fieldMaxLength={108}
                isRequired={false}
                defaultValue={initialValues.contactEmailText}
                onTextChange={() => {}}
                rawErrors={
                  getFieldError("contactEmailText")
                    ? [getFieldError("contactEmailText") as string]
                    : []
                }
                disabled={!isDraft}
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="attachments"
        className="display-flex flex-column gap-3 margin-top-4 padding-bottom-4 simpler-page-anchor-offset"
      >
        <div className="display-flex flex-column gap-2">
          <h2 className="margin-0 font-heading-xl">
            {t("sections.attachments")}
          </h2>
          <p className="margin-0 font-sans-lg text-base-dark maxw-full">
            {t("content.attachmentsIntro")}
          </p>
        </div>
        <OpportunityAttachmentUploadInput
          opportunityId={opportunityId}
          initialAttachments={initialAttachments}
          isDraft={isDraft}
        />
      </section>

      <div className="display-flex flex-justify margin-top-4">
        <div className="display-flex gap-2">
          <Button
            outline
            type="button"
            onClick={() => {
              if (!formRef.current) return;
              const formData = new FormData(formRef.current);
              formData.set("submitType", "saveAndGoBack");
              startTransition(() => formAction(formData));
            }}
            className="height-auto margin-0 margin-bottom-1 font-sans-sm text-bold line-height-sans-1"
          >
            {t("button.saveAndGoBack")}
          </Button>
        </div>
        <Button
          type="button"
          onClick={() => {
            if (!formRef.current) return;
            const formData = new FormData(formRef.current);
            formData.set("submitType", "saveAndContinue");
            startTransition(() => formAction(formData));
          }}
          className="height-auto margin-0 margin-bottom-1 font-sans-sm text-bold line-height-sans-1"
        >
          {t("button.saveAndContinue")}
        </Button>
      </div>
    </form>
  );
}
