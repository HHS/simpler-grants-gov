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
  Label,
  Radio,
  Select,
  Textarea,
  TextInput,
} from "@trussworks/react-uswds";

import { RequiredFieldIndicator } from "src/components/RequiredFieldIndicator";
import {
  ELIGIBILITY_OPTIONS,
  FUNDING_CATEGORY_OPTIONS,
  FUNDING_INSTRUMENT_OPTIONS,
  OPPORTUNITY_CATEGORY_OPTIONS,
  OpportunityEditFormValues,
} from "./opportunityEditFormConfig";

type Props = {
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
}: Props) {
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

  function toggleArrayValue(
    key: "fundingType" | "fundingCategories" | "eligibleApplicants",
    value: string,
  ) {
    setValues((currentValues) => {
      const currentFieldValues = currentValues[key];
      const nextFieldValues = currentFieldValues.includes(value)
        ? currentFieldValues.filter((currentValue) => currentValue !== value)
        : [...currentFieldValues, value];

      return { ...currentValues, [key]: nextFieldValues };
    });
  }

  function formatNumber(value: string): string {
    const raw = value.replace(/,/g, "");
    if (!raw || isNaN(Number(raw))) return value;
    return Number(raw).toLocaleString("en-US");
  }

  function getFieldError(
    fieldName: keyof OpportunityEditValidationErrors,
  ): string | undefined {
    const fieldErrors = validationErrors?.[fieldName];
    return fieldErrors?.[0];
  }

  useEffect(() => {
    if (formState.newOpportunitySummaryId) {
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
  const eligibilityDisplayLabels: Record<string, string> = {
    for_profit_organizations_other_than_small_businesses: t(
      "eligibilityOptions.forProfitOrganizationsOtherThanSmallBusinesses",
    ),
    small_businesses: t("eligibilityOptions.smallBusinesses"),
    independent_school_districts: t(
      "eligibilityOptions.independentSchoolDistricts",
    ),
    private_institutions_of_higher_education: t(
      "eligibilityOptions.privateInstitutionsOfHigherEducation",
    ),
    public_and_state_institutions_of_higher_education: t(
      "eligibilityOptions.publicAndStateInstitutionsOfHigherEducation",
    ),
    city_or_township_governments: t(
      "eligibilityOptions.cityOrTownshipGovernments",
    ),
    county_governments: t("eligibilityOptions.countyGovernments"),
    federally_recognized_native_american_tribal_governments: t(
      "eligibilityOptions.federallyRecognizedNativeAmericanTribalGovernments",
    ),
    public_and_indian_housing_authorities: t(
      "eligibilityOptions.publicAndIndianHousingAuthorities",
    ),
    special_district_governments: t(
      "eligibilityOptions.specialDistrictGovernments",
    ),
    state_governments: t("eligibilityOptions.stateGovernments"),
    other_native_american_tribal_organizations: t(
      "eligibilityOptions.otherNativeAmericanTribalOrganizations",
    ),
    nonprofits_non_higher_education_with_501c3: t(
      "eligibilityOptions.nonprofitsNonHigherEducationWith501c3",
    ),
    nonprofits_non_higher_education_without_501c3: t(
      "eligibilityOptions.nonprofitsNonHigherEducationWithout501c3",
    ),
    individuals: t("eligibilityOptions.individuals"),
    other: t("eligibilityOptions.other"),
    unrestricted: t("eligibilityOptions.unrestricted"),
  };

  function renderEligibilityCheckboxGroup(
    title: string,
    options: typeof ELIGIBILITY_OPTIONS,
    baseId: string,
  ) {
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
                checked={values.eligibleApplicants.includes(option.value)}
                onChange={() =>
                  toggleArrayValue("eligibleApplicants", option.value)
                }
                disabled={!isDraft}
              />
            </div>
          ))}
        </div>
      </Fieldset>
    );
  }

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
            type="error"
            heading={t("content.alerts.validationHeading")}
            headingLevel="h3"
            noIcon
          />
        </div>
      ) : null}

      <section className="margin-top-4">
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

      <section className="margin-top-4">
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
                <Label
                  htmlFor="funding-type-values"
                  className="font-sans-sm text-bold"
                >
                  {t("labels.fundingType")}
                  <span className="text-secondary-dark">
                    <RequiredFieldIndicator> *</RequiredFieldIndicator>
                  </span>
                </Label>
                <p className="margin-top-1 margin-bottom-2 font-sans-sm text-base">
                  {t("content.fundingTypeHint")}
                </p>
                {getFieldError("fundingType") ? (
                  <ErrorMessage>{getFieldError("fundingType")}</ErrorMessage>
                ) : null}
                <Select
                  id="funding-type-values"
                  name="funding-type-values"
                  value={values.fundingType[0] ?? ""}
                  onChange={(event) =>
                    updateField(
                      "fundingType",
                      event.target.value ? [event.target.value] : [],
                    )
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
                <Label
                  htmlFor="cost-sharing-yes"
                  className="font-sans-sm text-bold"
                >
                  {t("labels.costSharing")}
                </Label>
                <p className="margin-top-1 margin-bottom-2 font-sans-sm text-base">
                  {t("content.costSharingHint")}
                </p>
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
                <Label
                  htmlFor="funding-category-values"
                  className="font-sans-sm text-bold"
                >
                  {t("labels.category")}
                  <span className="text-secondary-dark">
                    <RequiredFieldIndicator> *</RequiredFieldIndicator>
                  </span>
                </Label>
                <p className="margin-top-1 margin-bottom-2 font-sans-sm text-base">
                  {t("content.categoryHint")}
                </p>
                {getFieldError("fundingCategory") ? (
                  <ErrorMessage>
                    {getFieldError("fundingCategory")}
                  </ErrorMessage>
                ) : null}
                <Select
                  id="funding-category-values"
                  name="funding-category-values"
                  value={values.fundingCategories[0] ?? ""}
                  onChange={(event) =>
                    updateField(
                      "fundingCategories",
                      event.target.value ? [event.target.value] : [],
                    )
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

          {values.fundingCategories[0] === "other" && (
            <div className="width-full">
              <FormGroup>
                <Label
                  htmlFor="funding-category-explanation"
                  className="font-sans-sm text-bold"
                >
                  {t("labels.fundingCategoryExplanation")}
                </Label>
                <p className="margin-top-1 margin-bottom-2 font-sans-sm text-base">
                  {t("content.fundingCategoryExplanationHint")}
                </p>
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
                <Label
                  htmlFor="expected-number-of-awards"
                  className="font-sans-sm text-bold"
                >
                  {t("labels.expectedNumberOfAwards")}
                  <span className="text-secondary-dark">
                    <RequiredFieldIndicator> *</RequiredFieldIndicator>
                  </span>
                </Label>
                <p className="margin-top-1 margin-bottom-2 font-sans-sm text-base">
                  {t("content.expectedNumberOfAwardsHint")}
                </p>
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
                <Label
                  htmlFor="estimated-total-program-funding"
                  className="font-sans-sm text-bold"
                >
                  {t("labels.estimatedTotalProgramFunding")}
                  <span className="text-secondary-dark">
                    <RequiredFieldIndicator> *</RequiredFieldIndicator>
                  </span>
                </Label>
                <p className="margin-top-1 margin-bottom-2 font-sans-sm text-base">
                  {t("content.estimatedTotalProgramFundingHint")}
                </p>
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
                <Label
                  htmlFor="award-minimum"
                  className="font-sans-sm text-bold"
                >
                  {t("labels.awardMinimum")}
                  <span className="text-secondary-dark">
                    <RequiredFieldIndicator> *</RequiredFieldIndicator>
                  </span>
                </Label>
                <p className="margin-top-1 margin-bottom-2 font-sans-sm text-base">
                  {t("content.awardMinimumHint")}
                </p>
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
                <Label
                  htmlFor="award-maximum"
                  className="font-sans-sm text-bold"
                >
                  {t("labels.awardMaximum")}
                  <span className="text-secondary-dark">
                    <RequiredFieldIndicator> *</RequiredFieldIndicator>
                  </span>
                </Label>
                <p className="margin-top-1 margin-bottom-2 font-sans-sm text-base">
                  {t("content.awardMaximumHint")}
                </p>
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
                <Label
                  htmlFor="publish-date"
                  className="font-sans-sm text-bold"
                >
                  {t("labels.publishDate")}
                  <span className="text-secondary-dark">
                    <RequiredFieldIndicator> *</RequiredFieldIndicator>
                  </span>
                </Label>
                <p className="margin-top-1 margin-bottom-2 font-sans-sm text-base">
                  {t("content.publishDateHint")}
                </p>
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
                <Label htmlFor="close-date" className="font-sans-sm text-bold">
                  {t("labels.closeDate")}
                </Label>
                <p className="margin-top-1 margin-bottom-2 font-sans-sm text-base">
                  {t("content.closeDateHint")}
                </p>
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

          <div className="width-full">
            <FormGroup>
              <Label
                htmlFor="close-date-explanation"
                className="font-sans-sm text-bold"
              >
                {t("labels.closeDateExplanation")}
              </Label>
              <p className="margin-top-1 margin-bottom-2 font-sans-sm text-base">
                {t("content.closeDateExplanationHint")}
              </p>
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
        </div>
      </section>

      <section className="margin-top-4 padding-bottom-4 border-bottom border-base-light">
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
            <Label
              htmlFor="eligible-applicants-values"
              className="font-sans-sm text-bold"
            >
              {t("labels.eligibleApplicants")}
              <span className="text-secondary-dark">
                <RequiredFieldIndicator> *</RequiredFieldIndicator>
              </span>
            </Label>
            <p className="margin-top-1 margin-bottom-0 font-sans-sm text-base maxw-mobile-lg">
              {t("content.eligibleApplicantsHint")}
            </p>
            {getFieldError("eligibleApplicants") ? (
              <ErrorMessage>{getFieldError("eligibleApplicants")}</ErrorMessage>
            ) : null}
          </FormGroup>

          <div className="grid-row grid-gap-xl margin-top-4">
            <div className="tablet:grid-col-6">
              <div>
                {renderEligibilityCheckboxGroup(
                  t("labels.eligibilityBusiness"),
                  eligibilityGroups.business,
                  "eligible-business",
                )}
                {renderEligibilityCheckboxGroup(
                  t("labels.eligibilityEducation"),
                  eligibilityGroups.education,
                  "eligible-education",
                )}
                {renderEligibilityCheckboxGroup(
                  t("labels.eligibilityGovernment"),
                  eligibilityGroups.government,
                  "eligible-government",
                )}
              </div>
            </div>
            <div className="tablet:grid-col-6">
              <div>
                {renderEligibilityCheckboxGroup(
                  t("labels.eligibilityNonprofit"),
                  eligibilityGroups.nonprofit,
                  "eligible-nonprofit",
                )}
                {renderEligibilityCheckboxGroup(
                  t("labels.eligibilityMiscellaneous"),
                  eligibilityGroups.misc,
                  "eligible-misc",
                )}
              </div>
            </div>
          </div>

          <div className="width-full">
            <FormGroup error={!!getFieldError("additionalEligibilityInfo")}>
              <Label
                htmlFor="additional-eligibility-info"
                className="font-sans-sm text-bold"
              >
                {t("labels.additionalEligibilityInfo")}
                <span className="text-secondary-dark">
                  <RequiredFieldIndicator> *</RequiredFieldIndicator>
                </span>
              </Label>
              <p className="margin-top-1 margin-bottom-2 font-sans-sm text-base">
                {t("content.additionalEligibilityInfoHint")}
              </p>
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
        </div>
      </section>

      <section className="margin-top-4 padding-bottom-4 border-bottom border-base-light">
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
              <Label htmlFor="description" className="font-sans-sm text-bold">
                {t("labels.description")}
                <span className="text-secondary-dark">
                  <RequiredFieldIndicator> *</RequiredFieldIndicator>
                </span>
              </Label>
              <p className="margin-top-1 margin-bottom-2 font-sans-sm text-base">
                {t("content.descriptionHint")}
              </p>
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
                <Label
                  htmlFor="additional-info-url"
                  className="font-sans-sm text-bold"
                >
                  {t("labels.additionalInfoUrl")}
                  <span className="text-secondary-dark">
                    <RequiredFieldIndicator> *</RequiredFieldIndicator>
                  </span>
                </Label>
                <p className="margin-top-1 margin-bottom-2 font-sans-sm text-base">
                  {t("content.additionalInfoUrlHint")}
                </p>
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
                <Label
                  htmlFor="additional-info-url-text"
                  className="font-sans-sm text-bold"
                >
                  {t("labels.additionalInfoUrlText")}
                  <span className="text-secondary-dark">
                    <RequiredFieldIndicator> *</RequiredFieldIndicator>
                  </span>
                </Label>
                <p className="margin-top-1 margin-bottom-2 font-sans-sm text-base">
                  {t("content.additionalInfoUrlTextHint")}
                </p>
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
              <Label
                htmlFor="grantor-contact-details"
                className="font-sans-sm text-bold"
              >
                {t("labels.grantorContactDetails")}
                <span className="text-secondary-dark">
                  <RequiredFieldIndicator> *</RequiredFieldIndicator>
                </span>
              </Label>
              <p className="margin-top-1 margin-bottom-2 font-sans-sm text-base">
                {t("content.grantorContactDetailsHint")}
              </p>
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
                <Label
                  htmlFor="contact-email"
                  className="font-sans-sm text-bold"
                >
                  {t("labels.contactEmail")}
                  <span className="text-secondary-dark">
                    <RequiredFieldIndicator> *</RequiredFieldIndicator>
                  </span>
                </Label>
                <p className="margin-top-1 margin-bottom-2 font-sans-sm text-base">
                  {t("content.contactEmailHint")}
                </p>
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
                <Label
                  htmlFor="contact-email-text"
                  className="font-sans-sm text-bold"
                >
                  {t("labels.contactEmailText")}
                  <span className="text-secondary-dark">
                    <RequiredFieldIndicator> *</RequiredFieldIndicator>
                  </span>
                </Label>
                <p className="margin-top-1 margin-bottom-2 font-sans-sm text-base">
                  {t("content.contactEmailTextHint")}
                </p>
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
