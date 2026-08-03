"use client";

import { AgencyContact } from "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/_components/sections/AgencyContact";
import { SubmissionSetUp } from "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/_components/sections/SubmissionSetUp";
import { SubmissionWindow } from "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/_components/sections/SubmissionWindow";
import {
  CompetitionActionState,
  competitionFormAction,
} from "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/actions";
import { FormType } from "src/types/allFormsResponseTypes";
import { CompetitionFormsSubmitApi } from "src/types/competitionsResponseTypes";

import { useTranslations } from "next-intl";
import React, { useRef, useState } from "react";
import { Alert, Button, ModalRef } from "@trussworks/react-uswds";

import { FormSelectModal } from "./FormSelectModal";

type CompetitionFormProps = {
  opportunityId: string;
  competitionId: string;
  forms: FormType[];
};

export function CompetitionForm({
  opportunityId: _opportunityId,
  competitionId: _competitionId,
  forms,
}: CompetitionFormProps) {
  const t = useTranslations("OpportunityCompetition");

  const formModalRef = useRef<ModalRef | null>(null);

  // Store the server response
  const [formState, setFormState] = useState<CompetitionActionState | null>(
    null,
  );
  const [isPending, setIsPending] = useState(false);
  const [competitionForms, setCompetitionForms] =
    useState<CompetitionFormsSubmitApi>([]);

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    // 1. Dynamically get the route and bind to the server action
    // The default route is triggered by the saveAndExit button in the header component
    const submitterButton = event.nativeEvent.submitter;
    const submitType = submitterButton?.dataset.submitType || "saveAndExit";
    const saveDataAndRoute = competitionFormAction.bind(null, submitType);

    // 2. Execute manually (FormData must be explicitly passed as the final argument)
    const formData = new FormData(event.currentTarget);
    saveDataAndRoute(formData)
      .then((result) => setFormState(result))
      .catch(() => setFormState({ errorMessage: t("alerts.networkError") }))
      .finally(() => setIsPending(false));
  };

  return (
    <form id="opportunity-competition-form" onSubmit={handleSubmit}>
      <input type="hidden" name="opportunityId" value={_opportunityId} />
      <input type="hidden" name="competitionId" value={_competitionId} />

      {formState?.errorMessage ? (
        <div className="margin-top-2">
          <Alert
            type="error"
            heading={formState.errorMessage}
            headingLevel="h3"
          >
            <span className="display-block margin-top-1 margin-bottom-1">
              {t("alerts.validationErrorBody")}
            </span>
            {formState?.validationErrors?.map((error, index) => (
              <span key={index} className="display-block">
                {error}
              </span>
            ))}
          </Alert>
        </div>
      ) : null}

      <div className="bg-white">
        {/* TODO(#10507): remove minh-viewport once the competition page has enough content that sticky nav no longer releases */}
        <div className="grid-container padding-bottom-4 minh-viewport">
          <section className="order-2 width-full maxw-tablet-xl padding-top-4">
            <div
              id="application-requirements"
              className="padding-bottom-4 border-bottom border-base-lighter simpler-page-anchor-offset"
            >
              <h2 className="font-heading-xl margin-top-0 margin-bottom-1">
                {t("applicationRequirements")}
              </h2>
              <p className="font-body-lg text-base-dark margin-top-0">
                {t("applicationRequirementsSubheader")}
              </p>
              <SubmissionSetUp />
              <SubmissionWindow />
              <AgencyContact />
            </div>
            <div className="display-flex flex-justify margin-top-4">
              <div className="display-flex gap-2">
                <Button
                  type="submit"
                  data-submit-type="saveAndGoBack"
                  className="usa-button--outline"
                >
                  {isPending ? t("button.processing") : t("button.back")}
                </Button>
              </div>
              <FormSelectModal
                competitionForms={competitionForms}
                forms={forms}
                formModalRef={formModalRef}
                submitCompetitionForms={(forms: CompetitionFormsSubmitApi) => {
                  setCompetitionForms(forms);
                }}
              />
              <Button type="submit" data-submit-type="saveAndContinue">
                {isPending
                  ? t("button.processing")
                  : t("button.saveAndContinue")}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
