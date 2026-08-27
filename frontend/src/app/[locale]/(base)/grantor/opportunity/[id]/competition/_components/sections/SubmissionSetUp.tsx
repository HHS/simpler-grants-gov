"use client";

import { ApplicantTypes } from "src/types/competitionsResponseTypes";

import { useTranslations } from "next-intl";

import {
  CommonSelectInput,
  CommonTextInput,
} from "src/components/core/forms/CommonFormFields";

type SubmissionSetUpProps = {
  publicCompetitionId?: string | null;
  competitionTitle?: string | null;
  openToApplicants?: ApplicantTypes[];
};

export function SubmissionSetUp({
  publicCompetitionId,
  competitionTitle,
  openToApplicants = [],
}: SubmissionSetUpProps) {
  const t = useTranslations("OpportunityCompetition.sectionSubmissionSetUp");
  const applicantSelection =
    openToApplicants.length === 2
      ? "both"
      : openToApplicants[0] === "organization"
        ? "organizations_only"
        : openToApplicants[0] === "individual"
          ? "individuals_only"
          : "";

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
            labelText={t("publicCompetitionId")}
            description={t("publicCompetitionIdHint")}
            isRequired={false}
            fieldMaxLength={255}
            onTextChange={() => {}}
            defaultValue={publicCompetitionId ?? ""}
          />
        </div>
        <div className="tablet:grid-col">
          <CommonTextInput
            fieldId="competition_title"
            labelText={t("competitionTitle")}
            description={t("competitionTitleHint")}
            isRequired={true}
            fieldMaxLength={255}
            onTextChange={() => {}}
            defaultValue={competitionTitle ?? ""}
          />
        </div>
      </div>
      <CommonSelectInput
        fieldId="open_to_applicants"
        labelText={t("whoCanApply")}
        description={t("whoCanApplyHint")}
        isRequired={true}
        defaultSelection={applicantSelection}
        listKeyValuePairs={{
          organizations_only: t("whoCanApplyOrganizationsOnly"),
          individuals_only: t("whoCanApplyIndividualsOnly"),
          both: t("whoCanApplyBoth"),
        }}
        selectClassName="width-full maxw-none"
      />
    </div>
  );
}
