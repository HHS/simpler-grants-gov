"use client";

import { useTranslations } from "next-intl";
import { DatePicker, FormGroup } from "@trussworks/react-uswds";

import { CommonTextInput } from "src/components/core/forms/CommonFormFields";
import { DynamicFieldLabel } from "src/components/core/forms/DynamicFieldLabel";

type SubmissionWindowProps = {
  openingDate?: string | null;
  closingDate?: string | null;
};

export function SubmissionWindow({
  openingDate,
  closingDate,
}: SubmissionWindowProps) {
  const t = useTranslations("OpportunityCompetition.sectionSubmissionWindow");

  return (
    <div
      id="submission-window"
      className="padding-bottom-4 border-bottom border-base-lighter margin-top-4 simpler-page-anchor-offset"
    >
      <h2 className="font-heading-lg margin-top-0 margin-bottom-1">
        {t("header")}
      </h2>
      <p className="font-body-md text-base-dark margin-top-0">
        {t("subHeader")}
      </p>
      <div className="grid-row grid-gap-lg">
        <div className="tablet:grid-col-6">
          <FormGroup>
            <DynamicFieldLabel
              idFor="opening_date"
              title={t("submissionsOpen")}
              description={t("submissionsOpenHint")}
            />
            <DatePicker
              id="opening_date"
              name="opening_date"
              defaultValue={openingDate ?? ""}
              placeholder="mm/dd/yyyy"
              className="width-full"
            />
          </FormGroup>
        </div>
        <div className="tablet:grid-col-6">
          <FormGroup>
            <DynamicFieldLabel
              idFor="closing_date"
              title={t("submissionsClose")}
              description={t("submissionsCloseHint")}
              required={true}
            />
            <DatePicker
              id="closing_date"
              name="closing_date"
              defaultValue={closingDate ?? ""}
              placeholder="mm/dd/yyyy"
              className="width-full"
            />
          </FormGroup>
        </div>
      </div>
      <div className="margin-top-3">
        <p className="font-body-md text-bold margin-bottom-0">
          {t("howManyApplications")}
        </p>
        <p className="font-body-md text-base-dark margin-top-1">
          {t("howManyApplicationsHint")}
        </p>
        <CommonTextInput
          fieldId="expected-number-of-applicants"
          labelText={t("expectedNumberOfApplicants")}
          description={t("expectedNumberOfApplicantsHint")}
          isRequired={true}
          fieldMaxLength={255}
          onTextChange={() => {}}
        />
      </div>
    </div>
  );
}
