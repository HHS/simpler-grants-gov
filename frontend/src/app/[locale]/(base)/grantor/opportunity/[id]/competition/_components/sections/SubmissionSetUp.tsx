"use client";

import { useTranslations } from "next-intl";

import {
  CommonSelectInput,
  CommonTextInput,
} from "src/components/core/forms/CommonFormFields";

export function SubmissionSetUp() {
  const t = useTranslations("OpportunityCompetition.sectionSubmissionSetUp");

  return (
    <div
      id="submission-set-up"
      className="margin-top-4 padding-bottom-4 border-bottom border-base-lighter simpler-page-anchor-offset"
    >
      <h2 className="font-heading-lg margin-top-0 margin-bottom-1">
        {t("header")}
      </h2>
      <p className="font-body-md text-base-dark margin-top-0">
        {t("subHeader")}
      </p>
      <div className="grid-row grid-gap-2">
        <div className="tablet:grid-col">
          <CommonTextInput
            fieldId="competition-id"
            labelText={t("competitionId")}
            description={t("competitionIdHint")}
            isRequired={false}
            fieldMaxLength={255}
            onTextChange={() => {}}
          />
        </div>
        <div className="tablet:grid-col">
          <CommonTextInput
            fieldId="competition-title"
            labelText={t("competitionTitle")}
            description={t("competitionTitleHint")}
            isRequired={false}
            fieldMaxLength={255}
            onTextChange={() => {}}
          />
        </div>
      </div>
      <CommonSelectInput
        fieldId="who-can-apply"
        labelText={t("whoCanApply")}
        description={t("whoCanApplyHint")}
        isRequired={true}
        listKeyValuePairs={{
          organizations_only: t("whoCanApplyOrganizationsOnly"),
          individuals_only: t("whoCanApplyIndividualsOnly"),
          both: t("whoCanApplyBoth"),
        }}
        selectClassName="width-full maxw-none"
      />
      <div className="grid-row grid-gap-2">
        <div className="tablet:grid-col">
          <CommonTextInput
            fieldId="expected-number-of-applicants"
            labelText={t("expectedNumberOfApplicants")}
            description={t("expectedNumberOfApplicantsHint")}
            isRequired={false}
            fieldMaxLength={255}
            onTextChange={() => {}}
          />
        </div>
        <div className="tablet:grid-col">
          <CommonTextInput
            fieldId="expected-application-size"
            labelText={t("expectedApplicationSize")}
            description={t("expectedApplicationSizeHint")}
            isRequired={false}
            fieldMaxLength={255}
            onTextChange={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
