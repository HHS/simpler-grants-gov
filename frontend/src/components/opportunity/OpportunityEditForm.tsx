"use client";

import {
  saveOpportunityEditAction,
  type OpportunityEditValidationErrors,
} from "src/app/[locale]/(base)/opportunity/[id]/edit/actions";

import { useTranslations } from "next-intl";
import { startTransition, useActionState, useEffect, useState } from "react";
import {
  Alert,
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

import { DynamicFieldLabel } from "src/components/applyForm/widgets/DynamicFieldLabel";
import {
  ELIGIBILITY_OPTIONS,
  FUNDING_CATEGORY_OPTIONS,
  FUNDING_INSTRUMENT_OPTIONS,
  OPPORTUNITY_CATEGORY_OPTIONS,
  OpportunityEditFormValues,
} from "./opportunityEditFormConfig";

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
  selectedValues: string[];
  onToggle: (value: string) => void;
  disabled: boolean;
};

function EligibilityCheckboxGroup({
  title,
  options,
  baseId,
  selectedValues,
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
              checked={selectedValues.includes(option.value)}
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
  isNewlyCreated?: boolean;
  opportunityKeyInformation: {
    title: string;
    agency: string;
    assistanceListings: string;
    opportunityNumber: string;
    opportunityStage: string;
    awardSelectionMethod: string;
    awardSelectionMethodExplanation: string;
  };
};

export default function OpportunityEditForm({
  opportunityId,
  opportunitySummaryId,
  isForecast = false,
  initialValues,
  isDraft = false,
  isNewlyCreated = false,
  opportunityKeyInformation,
}: OpportunityEditFormProps) {
  const t = useTranslations("OpportunityEdit");
  const [values, setValues] =
    useState<OpportunityEditFormValues>(initialValues);
  const [currentSummaryId, setCurrentSummaryId] =
    useState(opportunitySummaryId);
  const [formState, formAction] = useActionState(saveOpportunityEditAction, {
    validationErrors: {},
  });
  const validationErrors: OpportunityEditValidationErrors | undefined =
    formState.validationErrors;

  function updateField<K extends keyof OpportunityEditFormValues>(
    key: K,
    value: OpportunityEditFormValues[K],
  ) {
    setValues((currentValues) => ({ ...currentValues, [key]: value }));
  }

  function toggleArrayValue(key: "eligibleApplicants", value: string) {
    setValues((currentValues) => {
      const currentFieldValues = currentValues[key];
      const nextFieldValues = currentFieldValues.includes(value)
        ? currentFieldValues.filter((currentValue) => currentValue !== value)
        : [...currentFieldValues, value];

      return { ...currentValues, [key]: nextFieldValues };
    });
  }

  function getFieldError(
    fieldName: keyof OpportunityEditValidationErrors,
  ): string | undefined {
    const fieldErrors = validationErrors?.[fieldName];
    return fieldErrors?.[0];
  }

  useEffect(() => {
    if (formState.newOpportunitySummaryId) {
      // TODO #9633
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentSummaryId(formState.newOpportunitySummaryId);
    }
  }, [formState.newOpportunitySummaryId]);

  const awardSelectionMethodLabel =
    OPPORTUNITY_CATEGORY_OPTIONS.find(
      (option) => option.value === values.awardSelectionMethod,
    )?.label ??
    values.awardSelectionMethod ??
    t("content.notAvailable");

  const keyInformationItems = [
    {
      label: t("labels.title"),
      value: opportunityKeyInformation.title || t("content.notAvailable"),
    },
    {
      label: t("labels.agency"),
      value: opportunityKeyInformation.agency || t("content.notAvailable"),
    },
    {
      label: t("labels.assistanceListings"),
      value:
        opportunityKeyInformation.assistanceListings ||
        t("content.notAvailable"),
    },
    {
      label: t("labels.opportunityNumber"),
      value:
        opportunityKeyInformation.opportunityNumber ||
        t("content.notAvailable"),
    },
    {
      label: t("labels.opportunityStage"),
      value:
        opportunityKeyInformation.opportunityStage || t("content.notAvailable"),
    },
    {
      label: t("labels.awardSelectionMethod"),
      value:
        awardSelectionMethodLabel ||
        opportunityKeyInformation.awardSelectionMethod ||
        t("content.notAvailable"),
    },
    {
      label: t("labels.awardSelectionMethodExplanation"),
      value:
        opportunityKeyInformation.awardSelectionMethodExplanation ||
        t("content.notAvailable"),
    },
  ];

  const leftColumnItems = keyInformationItems.slice(0, 3);
  const rightColumnItems = keyInformationItems.slice(3);
  const eligibilityGroups = {
    business: ELIGIBILITY_OPTIONS.filter((option) =>
      [
        "for_profit_organizations_other_than_small_businesses",
        "small_businesses",
      ].includes(option.value),
    ),
    education: ELIGIBILITY_OPTIONS.filter((option) =>
      [
        "independent_school_districts",
        "private_institutions_of_higher_education",
        "public_and_state_institutions_of_higher_education",
      ].includes(option.value),
    ),
    government: ELIGIBILITY_OPTIONS.filter((option) =>
      [
        "city_or_township_governments",
        "county_governments",
        "special_district_governments",
        "state_governments",
        "federally_recognized_native_american_tribal_governments",
        "public_and_indian_housing_authorities",
      ].includes(option.value),
    ),
    nonprofit: ELIGIBILITY_OPTIONS.filter((option) =>
      [
        "other_native_american_tribal_organizations",
        "nonprofits_non_higher_education_with_501c3",
        "nonprofits_non_higher_education_without_501c3",
      ].includes(option.value),
    ),
    misc: ELIGIBILITY_OPTIONS.filter((option) =>
      ["individuals", "other", "unrestricted"].includes(option.value),
    ),
  };
  return (
    <form
      id="opportunity-edit-form"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => {
          formAction(formData);
        });
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
      <input type="hidden" name="title" value={values.title} />
      <input
        type="hidden"
        name="awardSelectionMethod"
        value={values.awardSelectionMethod}
      />

      {!isDraft ? (
        <div className="margin-top-2">
          <Alert type="warning" headingLevel="h3" noIcon>
            {t("content.draftOnlyWarning")}
          </Alert>
        </div>
      ) : null}

      {isNewlyCreated &&
      !formState.successMessage &&
      !formState.errorMessage ? (
        <div className="margin-top-2">
          <Alert
            type="success"
            heading={t("content.alerts.newOpportunityHeading")}
            headingLevel="h3"
          >
            {t("content.alerts.newOpportunityBody")}
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
            type="warning"
            heading={t("content.alerts.validationWarningHeading")}
            headingLevel="h3"
          >
            <p className="margin-top-1 margin-bottom-1">
              {t("content.alerts.validationWarningBody")}
            </p>
            <ul className="margin-top-1">
              {Object.values(formState.validationErrors)
                .flat()
                .map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
            </ul>
          </Alert>
        </div>
      ) : null}

      <section
        id="key-information"
        className="margin-top-4 simpler-page-anchor-offset"
      >
        <h2 className="font-heading-xl margin-top-0 margin-bottom-2">
          {t("sections.keyInformation")}
        </h2>
        <p className="margin-top-0 margin-bottom-4 font-sans-lg text-base">
          {t("content.keyInformationIntro")}
        </p>

        <Fieldset className="border border-base-lighter radius-lg padding-3">
          <div className="grid-row grid-gap-2">
            <div className="tablet:grid-col">
              {leftColumnItems.map((item) => (
                <FormGroup key={item.label} className="margin-bottom-2">
                  <div className="font-sans-md text-bold">{item.label}</div>
                  <p className="margin-0 font-sans-md text-base-dark">
                    {item.value}
                  </p>
                </FormGroup>
              ))}
            </div>
            <div className="tablet:grid-col">
              {rightColumnItems.map((item) => (
                <FormGroup key={item.label} className="margin-bottom-2">
                  <div className="font-sans-md text-bold">{item.label}</div>
                  <p className="margin-0 font-sans-md text-base-dark">
                    {item.value}
                  </p>
                </FormGroup>
              ))}
            </div>
          </div>
        </Fieldset>
      </section>

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
                  value={values.fundingType}
                  onChange={(event) =>
                    updateField("fundingType", event.target.value)
                  }
                  className="width-full"
                  disabled={!isDraft}
                >
                  <option value="">{t("content.select")}</option>
                  {FUNDING_INSTRUMENT_OPTIONS.map((option) => (
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
                      checked={values.costSharing === true}
                      onChange={() => updateField("costSharing", true)}
                      disabled={!isDraft}
                    />
                  </div>
                  <div className="grid-col-6">
                    <Radio
                      id="cost-sharing-no"
                      name="costSharing"
                      label={t("labels.no")}
                      value="false"
                      checked={values.costSharing === false}
                      onChange={() => updateField("costSharing", false)}
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
                  value={values.fundingCategories}
                  onChange={(event) =>
                    updateField("fundingCategories", event.target.value)
                  }
                  className="width-full"
                  disabled={!isDraft}
                >
                  <option value="">{t("content.selectFundingCategory")}</option>
                  {FUNDING_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormGroup>
            </div>
          </div>

          {values.fundingCategories === "other" && (
            <div className="width-full">
              <FormGroup>
                <DynamicFieldLabel
                  idFor="funding-category-explanation"
                  title={t("labels.fundingCategoryExplanation")}
                  description={t("content.fundingCategoryExplanationHint")}
                />
                <Textarea
                  id="funding-category-explanation"
                  name="fundingCategoryExplanation"
                  value={values.fundingCategoryExplanation}
                  onChange={(event) =>
                    updateField(
                      "fundingCategoryExplanation",
                      event.target.value,
                    )
                  }
                  rows={5}
                  className="width-full"
                  disabled={!isDraft}
                />
              </FormGroup>
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
                  value={values.expectedNumberOfAwards}
                  onChange={(event) =>
                    updateField("expectedNumberOfAwards", event.target.value)
                  }
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
                  value={formatNumber(values.estimatedTotalProgramFunding)}
                  onChange={(event) =>
                    updateField(
                      "estimatedTotalProgramFunding",
                      event.target.value.replace(/,/g, ""),
                    )
                  }
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
                  value={formatNumber(values.awardMinimum)}
                  onChange={(event) =>
                    updateField(
                      "awardMinimum",
                      event.target.value.replace(/,/g, ""),
                    )
                  }
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
                  value={formatNumber(values.awardMaximum)}
                  onChange={(event) =>
                    updateField(
                      "awardMaximum",
                      event.target.value.replace(/,/g, ""),
                    )
                  }
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
                  defaultValue={values.publishDate}
                  placeholder="mm/dd/yyyy"
                  onChange={(value) => updateField("publishDate", value ?? "")}
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
                  defaultValue={values.closeDate}
                  placeholder="mm/dd/yyyy"
                  onChange={(value) => updateField("closeDate", value ?? "")}
                  className="width-full"
                  disabled={!isDraft}
                />
              </FormGroup>
            </div>
          </div>

          {!values.closeDate && (
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
                  value={values.closeDateExplanation}
                  onChange={(event) =>
                    updateField("closeDateExplanation", event.target.value)
                  }
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
                  selectedValues={values.eligibleApplicants}
                  onToggle={(value) =>
                    toggleArrayValue("eligibleApplicants", value)
                  }
                  disabled={!isDraft}
                />
                <EligibilityCheckboxGroup
                  title={t("labels.eligibilityEducation")}
                  options={eligibilityGroups.education}
                  baseId="eligible-education"
                  selectedValues={values.eligibleApplicants}
                  onToggle={(value) =>
                    toggleArrayValue("eligibleApplicants", value)
                  }
                  disabled={!isDraft}
                />
                <EligibilityCheckboxGroup
                  title={t("labels.eligibilityGovernment")}
                  options={eligibilityGroups.government}
                  baseId="eligible-government"
                  selectedValues={values.eligibleApplicants}
                  onToggle={(value) =>
                    toggleArrayValue("eligibleApplicants", value)
                  }
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
                  selectedValues={values.eligibleApplicants}
                  onToggle={(value) =>
                    toggleArrayValue("eligibleApplicants", value)
                  }
                  disabled={!isDraft}
                />
                <EligibilityCheckboxGroup
                  title={t("labels.eligibilityMiscellaneous")}
                  options={eligibilityGroups.misc}
                  baseId="eligible-misc"
                  selectedValues={values.eligibleApplicants}
                  onToggle={(value) =>
                    toggleArrayValue("eligibleApplicants", value)
                  }
                  disabled={!isDraft}
                />
              </div>
            </div>
          </div>

          {(values.eligibleApplicants.includes("other") ||
            values.eligibleApplicants.includes("unrestricted")) && (
            <div className="width-full">
              <FormGroup error={!!getFieldError("additionalEligibilityInfo")}>
                <DynamicFieldLabel
                  idFor="additional-eligibility-info"
                  title={t("labels.additionalEligibilityInfo")}
                  description={t("content.additionalEligibilityInfoHint")}
                />
                {getFieldError("additionalEligibilityInfo") ? (
                  <ErrorMessage>
                    {getFieldError("additionalEligibilityInfo")}
                  </ErrorMessage>
                ) : null}
                <Textarea
                  id="additional-eligibility-info"
                  name="additionalEligibilityInfo"
                  value={values.additionalEligibilityInfo}
                  onChange={(event) =>
                    updateField("additionalEligibilityInfo", event.target.value)
                  }
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
            <FormGroup error={!!getFieldError("description")}>
              <DynamicFieldLabel
                idFor="description"
                title={t("labels.description")}
                description={t("content.descriptionHint")}
              />
              {getFieldError("description") ? (
                <ErrorMessage>{getFieldError("description")}</ErrorMessage>
              ) : null}
              <Textarea
                id="description"
                name="description"
                value={values.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                rows={5}
                className="width-full"
                disabled={!isDraft}
              />
            </FormGroup>
          </div>

          <div className="grid-row grid-gap-lg">
            <div className="tablet:grid-col-6">
              <FormGroup error={!!getFieldError("additionalInfoUrl")}>
                <DynamicFieldLabel
                  idFor="additional-info-url"
                  title={t("labels.additionalInfoUrl")}
                  description={t("content.additionalInfoUrlHint")}
                />
                {getFieldError("additionalInfoUrl") ? (
                  <ErrorMessage>
                    {getFieldError("additionalInfoUrl")}
                  </ErrorMessage>
                ) : null}
                <TextInput
                  id="additional-info-url"
                  name="additionalInfoUrl"
                  type="url"
                  value={values.additionalInfoUrl}
                  onChange={(event) =>
                    updateField("additionalInfoUrl", event.target.value)
                  }
                  className="width-full"
                  disabled={!isDraft}
                />
              </FormGroup>
            </div>
            <div className="tablet:grid-col-6">
              <FormGroup error={!!getFieldError("additionalInfoUrlText")}>
                <DynamicFieldLabel
                  idFor="additional-info-url-text"
                  title={t("labels.additionalInfoUrlText")}
                  description={t("content.additionalInfoUrlTextHint")}
                />
                {getFieldError("additionalInfoUrlText") ? (
                  <ErrorMessage>
                    {getFieldError("additionalInfoUrlText")}
                  </ErrorMessage>
                ) : null}
                <TextInput
                  id="additional-info-url-text"
                  name="additionalInfoUrlText"
                  type="text"
                  value={values.additionalInfoUrlText}
                  onChange={(event) =>
                    updateField("additionalInfoUrlText", event.target.value)
                  }
                  className="width-full"
                  disabled={!isDraft}
                />
              </FormGroup>
            </div>
          </div>

          <div className="width-full">
            <FormGroup error={!!getFieldError("grantorContactDetails")}>
              <DynamicFieldLabel
                idFor="grantor-contact-details"
                title={t("labels.grantorContactDetails")}
                description={t("content.grantorContactDetailsHint")}
              />
              {getFieldError("grantorContactDetails") ? (
                <ErrorMessage>
                  {getFieldError("grantorContactDetails")}
                </ErrorMessage>
              ) : null}
              <Textarea
                id="grantor-contact-details"
                name="grantorContactDetails"
                value={values.grantorContactDetails}
                onChange={(event) =>
                  updateField("grantorContactDetails", event.target.value)
                }
                rows={5}
                className="width-full"
                disabled={!isDraft}
              />
            </FormGroup>
          </div>

          <div className="grid-row grid-gap-lg">
            <div className="tablet:grid-col-6">
              <FormGroup error={!!getFieldError("contactEmail")}>
                <DynamicFieldLabel
                  idFor="contact-email"
                  title={t("labels.contactEmail")}
                  description={t("content.contactEmailHint")}
                />
                {getFieldError("contactEmail") ? (
                  <ErrorMessage>{getFieldError("contactEmail")}</ErrorMessage>
                ) : null}
                <TextInput
                  id="contact-email"
                  name="contactEmail"
                  type="email"
                  value={values.contactEmail}
                  onChange={(event) =>
                    updateField("contactEmail", event.target.value)
                  }
                  className="width-full"
                  disabled={!isDraft}
                />
              </FormGroup>
            </div>
            <div className="tablet:grid-col-6">
              <FormGroup error={!!getFieldError("contactEmailText")}>
                <DynamicFieldLabel
                  idFor="contact-email-text"
                  title={t("labels.contactEmailText")}
                  description={t("content.contactEmailTextHint")}
                />
                {getFieldError("contactEmailText") ? (
                  <ErrorMessage>
                    {getFieldError("contactEmailText")}
                  </ErrorMessage>
                ) : null}
                <TextInput
                  id="contact-email-text"
                  name="contactEmailText"
                  type="text"
                  value={values.contactEmailText}
                  onChange={(event) =>
                    updateField("contactEmailText", event.target.value)
                  }
                  className="width-full"
                  disabled={!isDraft}
                />
              </FormGroup>
            </div>
          </div>
        </div>
      </section>
    </form>
  );
}
