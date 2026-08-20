"use client";

import { OpportunityAttachmentUploadInput } from "src/app/[locale]/(base)/grantor/opportunity/[id]/edit/_components/OpportunityAttachmentUploadInput";
import {
  opportunityEditFormAction,
  type OpportunityEditValidationErrors,
} from "src/app/[locale]/(base)/grantor/opportunity/[id]/edit/actions";
import { getOpportunitySummaryValidationData } from "src/app/[locale]/(base)/grantor/opportunity/[id]/edit/opportunitySummaryValidation";
import {
  categoryOptions,
  eligbilityValueToGroup,
  ELIGIBILITY_OPTIONS,
  fundingOptions,
} from "src/constants/opportunity";
import { useZodFormValidation } from "src/hooks/useZodValidation";
import { OpportunityAttachment } from "src/types/opportunity/opportunityAttachmentTypes";
import { normalizeDateString } from "src/utils/dateUtil";
import { OpportunityEditFormValues } from "src/utils/opportunityEditFormConfig";
import { OpportunitySummaryCreateRequestV1Schema } from "src/validation-schemas/apiSchemas.zod";
import { stripCommasFromNumberString } from "tests/e2e/utils/common/number-formatters";

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

import {
  CommonCharacterCount,
  CommonWordLimit,
} from "src/components/core/forms/CommonFormFields";
import { DynamicFieldLabel } from "src/components/core/forms/DynamicFieldLabel";

const eligibilityDisplayLabels: Record<string, string> = Object.fromEntries(
  ELIGIBILITY_OPTIONS.map(({ value, label }) => [value, label]),
);

type EligibilityCheckboxGroupProps = {
  title: string;
  options: typeof ELIGIBILITY_OPTIONS;
  baseId: string;
  initialSelectedValues: string[];
  onToggle: (value: string) => void;
};

function EligibilityCheckboxGroup({
  title,
  options,
  baseId,
  initialSelectedValues,
  onToggle,
}: EligibilityCheckboxGroupProps) {
  return (
    <Fieldset className="margin-top-0 margin-bottom-4">
      <div className="font-sans-sm text-bold margin-bottom-1">{title}</div>
      <div className="display-flex flex-column">
        {options.map((option, index) => (
          <div key={option.value} className="padding-top-05">
            <Checkbox
              id={`${baseId}-${index}`}
              // selected these values will be collected in hidden inputs populated by state
              // so we don't want these inputs showing up in the form data
              name={""}
              value={option.value}
              label={eligibilityDisplayLabels[option.value] ?? option.label}
              defaultChecked={initialSelectedValues.includes(option.value)}
              onChange={() => onToggle(option.value)}
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
  initialAttachments?: OpportunityAttachment[];
};

export default function OpportunityEditForm({
  opportunityId,
  opportunitySummaryId,
  isForecast = false,
  initialValues,
  initialAttachments = [],
}: OpportunityEditFormProps) {
  const t = useTranslations("OpportunityEdit");
  const formRef = useRef<HTMLFormElement>(null);
  const [currentSummaryId, setCurrentSummaryId] =
    useState(opportunitySummaryId);

  // State for fields that drive conditional show/hide rendering and
  // the publish button enabled state.
  const [fundingCategory, setFundingCategory] = useState(
    initialValues.funding_categories,
  );
  const [postDate, setPostDate] = useState(initialValues.post_date);
  const [closeDate, setCloseDate] = useState(initialValues.close_date);
  const [selectedEligibility, setSelectedEligibility] = useState<string[]>(
    initialValues.applicant_types,
  );
  const [formState, formAction] = useActionState(opportunityEditFormAction, {
    validationErrors: {},
  });

  const fieldTranslations = useTranslations("OpportunityEdit.validationErrors");
  const { getFieldError, getFieldErrors, handleFieldBlur, validateField } =
    useZodFormValidation({
      schema: OpportunitySummaryCreateRequestV1Schema,
      serverErrors: formState.validationErrors,
      fieldTranslations: fieldTranslations,
      getValidationData: (formData) =>
        getOpportunitySummaryValidationData(formData, {
          post_date: normalizeDateString(postDate) ?? postDate,
          close_date: closeDate
            ? (normalizeDateString(closeDate) ?? closeDate)
            : null,
        }),
    });

  const handleDatePickerBlur = (
    field: keyof OpportunityEditValidationErrors,
  ) => {
    if (!formRef.current) {
      return;
    }

    validateField(field, formRef.current);
  };

  // Shared toggle handler for eligibility checkboxes.
  function handleEligibilityToggle(value: string) {
    const next = selectedEligibility.includes(value)
      ? selectedEligibility.filter((v) => v !== value)
      : [...selectedEligibility, value];
    setSelectedEligibility(next);
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
      onBlurCapture={handleFieldBlur}
      noValidate
    >
      <input type="hidden" name="opportunity_id" value={opportunityId} />
      <input
        type="hidden"
        name="opportunity_summary_id"
        value={currentSummaryId}
      />
      <input
        type="hidden"
        name="is_forecast"
        data-testid="isForecast-input"
        value={isForecast ? "true" : "false"}
      />
      <input
        type="hidden"
        name="opportunity_title"
        value={initialValues.opportunity_title}
      />
      <input type="hidden" name="category" value={initialValues.category} />

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
              <FormGroup error={!!getFieldError("funding_instruments")}>
                <DynamicFieldLabel
                  idFor="funding_instruments"
                  title={t("labels.fundingType")}
                  required
                  description={t("content.fundingTypeHint")}
                />
                {getFieldError("funding_instruments") ? (
                  <ErrorMessage>
                    {getFieldError("funding_instruments")}
                  </ErrorMessage>
                ) : null}
                <Select
                  id="funding_instruments"
                  name="funding_instruments"
                  defaultValue={initialValues.funding_instruments}
                  className="width-full"
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
                      name="is_cost_sharing"
                      label={t("labels.yes")}
                      value="true"
                      defaultChecked={initialValues.is_cost_sharing === true}
                    />
                  </div>
                  <div className="grid-col-6">
                    <Radio
                      id="cost-sharing-no"
                      name="is_cost_sharing"
                      label={t("labels.no")}
                      value="false"
                      defaultChecked={initialValues.is_cost_sharing === false}
                    />
                  </div>
                </div>
              </FormGroup>
            </div>
          </div>

          <div className="grid-row grid-gap-lg">
            <div className="tablet:grid-col-6">
              <FormGroup error={!!getFieldError("funding_categories")}>
                <DynamicFieldLabel
                  idFor="funding_categories"
                  title={t("labels.category")}
                  required
                  description={t("content.categoryHint")}
                />
                {getFieldError("funding_categories") ? (
                  <ErrorMessage>
                    {getFieldError("funding_categories")}
                  </ErrorMessage>
                ) : null}
                <Select
                  id="funding_categories"
                  name="funding_categories"
                  value={fundingCategory}
                  onChange={(event) => {
                    setFundingCategory(event.target.value);
                  }}
                  className="width-full"
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
                fieldId="funding_category_description"
                fieldMaxLength={2500}
                isRequired={false}
                defaultValue={initialValues.funding_category_description}
                onTextChange={() => {}}
              />
            </div>
          )}

          <div className="grid-row grid-gap-lg">
            <div className="tablet:grid-col-6">
              <FormGroup error={!!getFieldError("expected_number_of_awards")}>
                <DynamicFieldLabel
                  idFor="expected_number_of_awards"
                  title={t("labels.expectedNumberOfAwards")}
                  description={t("content.expectedNumberOfAwardsHint")}
                />
                {getFieldError("expected_number_of_awards") ? (
                  <ErrorMessage>
                    {getFieldError("expected_number_of_awards")}
                  </ErrorMessage>
                ) : null}
                <TextInput
                  id="expected_number_of_awards"
                  name="expected_number_of_awards"
                  type="text"
                  defaultValue={initialValues.expected_number_of_awards}
                  className="width-full"
                />
              </FormGroup>
            </div>
            <div className="tablet:grid-col-6">
              <FormGroup
                error={!!getFieldError("estimated_total_program_funding")}
              >
                <DynamicFieldLabel
                  idFor="estimated_total_program_funding"
                  title={t("labels.estimatedTotalProgramFunding")}
                  description={t("content.estimatedTotalProgramFundingHint")}
                />
                {getFieldError("estimated_total_program_funding") ? (
                  <ErrorMessage>
                    {getFieldError("estimated_total_program_funding")}
                  </ErrorMessage>
                ) : null}
                <TextInput
                  id="estimated_total_program_funding"
                  name="estimated_total_program_funding"
                  type="text"
                  defaultValue={stripCommasFromNumberString(
                    initialValues.estimated_total_program_funding,
                  )}
                  className="width-full"
                />
              </FormGroup>
            </div>
          </div>

          <div className="grid-row grid-gap-lg">
            <div className="tablet:grid-col-6">
              <FormGroup error={!!getFieldError("award_floor")}>
                <DynamicFieldLabel
                  idFor="award_floor"
                  title={t("labels.awardMinimum")}
                  description={t("content.awardMinimumHint")}
                />
                {getFieldError("award_floor") ? (
                  <ErrorMessage>{getFieldError("award_floor")}</ErrorMessage>
                ) : null}
                <TextInput
                  id="award_floor"
                  name="award_floor"
                  type="text"
                  defaultValue={stripCommasFromNumberString(
                    initialValues.award_floor,
                  )}
                  className="width-full"
                />
              </FormGroup>
            </div>
            <div className="tablet:grid-col-6">
              <FormGroup error={!!getFieldError("award_ceiling")}>
                <DynamicFieldLabel
                  idFor="award_ceiling"
                  title={t("labels.awardMaximum")}
                  description={t("content.awardMaximumHint")}
                />
                {getFieldError("award_ceiling") ? (
                  <ErrorMessage>{getFieldError("award_ceiling")}</ErrorMessage>
                ) : null}
                <TextInput
                  id="award_ceiling"
                  name="award_ceiling"
                  type="text"
                  defaultValue={stripCommasFromNumberString(
                    initialValues.award_ceiling,
                  )}
                  className="width-full"
                />
              </FormGroup>
            </div>
          </div>

          <div className="grid-row grid-gap-lg">
            <div className="tablet:grid-col-6">
              <FormGroup error={!!getFieldError("post_date")}>
                <DynamicFieldLabel
                  idFor="post_date"
                  title={t("labels.publishDate")}
                  required
                  description={t("content.publishDateHint")}
                />
                {getFieldError("post_date") ? (
                  <ErrorMessage>{getFieldError("post_date")}</ErrorMessage>
                ) : null}
                <DatePicker
                  id="post_date"
                  name="post_date"
                  defaultValue={initialValues.post_date}
                  placeholder="mm/dd/yyyy"
                  onChange={(value) => setPostDate(value ?? "")}
                  className="width-full"
                  onBlur={() => {
                    if (formRef.current) {
                      validateField("post_date", formRef.current);
                    }
                  }}
                />
              </FormGroup>
            </div>
            <div className="tablet:grid-col-6">
              <FormGroup error={!!getFieldError("close_date")}>
                <DynamicFieldLabel
                  idFor="close_date"
                  title={t("labels.closeDate")}
                  description={t("content.closeDateHint")}
                />
                {getFieldError("close_date") ? (
                  <ErrorMessage>{getFieldError("close_date")}</ErrorMessage>
                ) : null}
                <DatePicker
                  id="close_date"
                  name="close_date"
                  defaultValue={initialValues.close_date}
                  placeholder="mm/dd/yyyy"
                  onChange={(value) => setCloseDate(value ?? "")}
                  className="width-full"
                  onBlur={() => handleDatePickerBlur("close_date")}
                />
              </FormGroup>
            </div>
          </div>

          {!closeDate && (
            <div className="width-full">
              <FormGroup>
                <DynamicFieldLabel
                  idFor="close_date_description"
                  title={t("labels.closeDateExplanation")}
                  description={t("content.closeDateExplanationHint")}
                />
                <Textarea
                  id="close_date_description"
                  name="close_date_description"
                  defaultValue={initialValues.close_date_description}
                  rows={5}
                  className="width-full"
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
          <FormGroup error={!!getFieldError("applicant_types")}>
            <DynamicFieldLabel
              idFor="applicant_types"
              title={t("labels.eligibleApplicants")}
              required
              description={t("content.eligibleApplicantsHint")}
            />
            {getFieldError("applicant_types") ? (
              <ErrorMessage>{getFieldError("applicant_types")}</ErrorMessage>
            ) : null}
          </FormGroup>

          <div className="grid-row grid-gap-xl margin-top-4">
            <div className="tablet:grid-col-6">
              <div>
                <EligibilityCheckboxGroup
                  title={t("labels.eligibilityBusiness")}
                  options={eligibilityGroups.business}
                  baseId="eligible-business"
                  initialSelectedValues={initialValues.applicant_types}
                  onToggle={handleEligibilityToggle}
                />
                <EligibilityCheckboxGroup
                  title={t("labels.eligibilityEducation")}
                  options={eligibilityGroups.education}
                  baseId="eligible-education"
                  initialSelectedValues={initialValues.applicant_types}
                  onToggle={handleEligibilityToggle}
                />
                <EligibilityCheckboxGroup
                  title={t("labels.eligibilityGovernment")}
                  options={eligibilityGroups.government}
                  baseId="eligible-government"
                  initialSelectedValues={initialValues.applicant_types}
                  onToggle={handleEligibilityToggle}
                />
              </div>
            </div>
            <div className="tablet:grid-col-6">
              <div>
                <EligibilityCheckboxGroup
                  title={t("labels.eligibilityNonprofit")}
                  options={eligibilityGroups.nonprofit}
                  baseId="eligible-nonprofit"
                  initialSelectedValues={initialValues.applicant_types}
                  onToggle={handleEligibilityToggle}
                />
                <EligibilityCheckboxGroup
                  title={t("labels.eligibilityMiscellaneous")}
                  options={eligibilityGroups.miscellaneous}
                  baseId="eligible-misc"
                  initialSelectedValues={initialValues.applicant_types}
                  onToggle={handleEligibilityToggle}
                />
              </div>
            </div>
            {selectedEligibility.map((eligibility, index) => (
              <input
                key={`eligibility-${index}`}
                type="hidden"
                name={`applicant_types[${index}]`}
                value={eligibility}
              />
            ))}
          </div>

          {(selectedEligibility.includes("other") ||
            selectedEligibility.includes("unrestricted")) && (
            <div className="width-full">
              <CommonCharacterCount
                isTextArea={true}
                labelText={t("labels.additionalEligibilityInfo")}
                description={t("content.additionalEligibilityInfoHint")}
                fieldId="applicant_eligibility_description"
                fieldMaxLength={4000}
                isRequired={false}
                defaultValue={initialValues.applicant_eligibility_description}
                onTextChange={() => {}}
                rawErrors={getFieldErrors("applicant_eligibility_description")}
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
            <CommonWordLimit
              labelText={t("labels.description")}
              description={t("content.descriptionHint")}
              fieldId="summary_description"
              fieldMaxLength={500}
              isRequired={false}
              defaultValue={initialValues.summary_description}
              onTextChange={() => {}}
              rawErrors={getFieldErrors("summary_description")}
            />
          </div>

          <div className="grid-row grid-gap-lg">
            <div className="tablet:grid-col-6">
              <CommonCharacterCount
                inputType="url"
                labelText={t("labels.additionalInfoUrl")}
                description={t("content.additionalInfoUrlHint")}
                fieldId="additional_info_url"
                fieldMaxLength={250}
                isRequired={false}
                defaultValue={initialValues.additional_info_url}
                onTextChange={() => {}}
                rawErrors={getFieldErrors("additional_info_url")}
              />
            </div>
            <div className="tablet:grid-col-6">
              <CommonCharacterCount
                labelText={t("labels.additionalInfoUrlText")}
                description={t("content.additionalInfoUrlTextHint")}
                fieldId="additional_info_url_description"
                fieldMaxLength={250}
                isRequired={false}
                defaultValue={initialValues.additional_info_url_description}
                onTextChange={() => {}}
                rawErrors={getFieldErrors("additional_info_url_description")}
              />
            </div>
          </div>

          <div className="width-full">
            <CommonCharacterCount
              isTextArea={true}
              labelText={t("labels.grantorContactDetails")}
              description={t("content.grantorContactDetailsHint")}
              fieldId="agency_contact_description"
              fieldMaxLength={1000}
              isRequired={false}
              defaultValue={initialValues.agency_contact_description}
              onTextChange={() => {}}
              rawErrors={getFieldErrors("agency_contact_description")}
            />
          </div>

          <div className="grid-row grid-gap-lg">
            <div className="tablet:grid-col-6">
              <CommonCharacterCount
                inputType="email"
                labelText={t("labels.contactEmail")}
                description={t("content.contactEmailHint")}
                fieldId="agency_email_address"
                fieldMaxLength={130}
                isRequired={false}
                defaultValue={initialValues.agency_email_address}
                onTextChange={() => {}}
                rawErrors={getFieldErrors("agency_email_address")}
              />
            </div>
            <div className="tablet:grid-col-6">
              <CommonCharacterCount
                labelText={t("labels.contactEmailText")}
                description={t("content.contactEmailTextHint")}
                fieldId="agency_email_address_description"
                fieldMaxLength={108}
                isRequired={false}
                defaultValue={initialValues.agency_email_address_description}
                onTextChange={() => {}}
                rawErrors={getFieldErrors("agency_email_address_description")}
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
