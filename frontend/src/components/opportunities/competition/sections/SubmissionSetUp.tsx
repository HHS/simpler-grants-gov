"use client";

import { useTranslations } from "next-intl";

import {
  CommonSelectInput,
  CommonTextInput,
} from "src/components/grantor/CommonFormFields";

export function SubmissionSetUp() {
  const t = useTranslations("OpportunityCompetition");

  return (
    <div
      id="submission-set-up"
      className="margin-top-4 padding-bottom-4 border-bottom border-base-lighter simpler-page-anchor-offset"
    >
      <h2 className="font-heading-lg margin-top-0 margin-bottom-1">
        {t("sections.submissionSetUp")}
      </h2>
      <p className="font-body-md text-base margin-top-0">
        {t("sections.submissionSetUpSubheader")}
      </p>
      <div className="grid-row grid-gap-2">
        <div className="tablet:grid-col">
          <CommonTextInput
            fieldId="competition-id"
            labelText={t("sections.competitionId")}
            description={t("sections.competitionIdHint")}
            isRequired={false}
            fieldMaxLength={255}
            onTextChange={() => {}}
          />
        </div>
        <div className="tablet:grid-col">
          <CommonTextInput
            fieldId="competition-title"
            labelText={t("sections.competitionTitle")}
            description={t("sections.competitionTitleHint")}
            isRequired={false}
            fieldMaxLength={255}
            onTextChange={() => {}}
          />
        </div>
      </div>
      <CommonSelectInput
        fieldId="who-can-apply"
        labelText={t("sections.whoCanApply")}
        description={t("sections.whoCanApplyHint")}
        isRequired={true}
        listKeyValuePairs={{
          organizations_only: t("sections.whoCanApplyOrganizationsOnly"),
          individuals_only: t("sections.whoCanApplyIndividualsOnly"),
          both: t("sections.whoCanApplyBoth"),
        }}
      />
      <div className="grid-row grid-gap-2">
        <div className="tablet:grid-col">
          <CommonTextInput
            fieldId="expected-number-of-applicants"
            labelText={t("sections.expectedNumberOfApplicants")}
            description={t("sections.expectedNumberOfApplicantsHint")}
            isRequired={false}
            fieldMaxLength={255}
            onTextChange={() => {}}
          />
        </div>
        <div className="tablet:grid-col">
          <CommonTextInput
            fieldId="expected-application-size"
            labelText={t("sections.expectedApplicationSize")}
            description={t("sections.expectedApplicationSizeHint")}
            isRequired={false}
            fieldMaxLength={255}
            onTextChange={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
