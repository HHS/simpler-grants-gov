"use client";

import { AgencyContact } from "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/_components/sections/AgencyContact";
import { SubmissionSetUp } from "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/_components/sections/SubmissionSetUp";
import { SubmissionWindow } from "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/_components/sections/SubmissionWindow";
import { FormType } from "src/types/allFormsResponseTypes";
import { Competition } from "src/types/competitionsResponseTypes";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import {
  Button,
  Link,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import LeftHandFormNav from "src/components/core/forms/LeftHandFormNav";
import { FormSelectModal } from "./FormSelectModal";

type CompetitionFormProps = {
  opportunityId: string;
  competitionId: string;
  competition: Competition;
  forms: FormType[];
  submitCompetitionForms: (
    competitionId: string,
    body: { forms: { form_id: string; is_required: boolean }[] },
  ) => Promise<void>;
};

export function CompetitionForm({
  opportunityId: _opportunityId,
  competitionId: _competitionId,
  forms,
  competition,
  submitCompetitionForms,
}: CompetitionFormProps) {
  const t = useTranslations("OpportunityCompetition");
  const editUrl = "../" + _opportunityId + "/edit";
  const overviewUrl = "../" + _opportunityId + "/overview";

  const formModalRef = useRef<ModalRef | null>(null);

  const navigationItems = [
    {
      text: t("applicationRequirements"),
      href: "application-requirements",
    },
    {
      text: t("sectionSubmissionSetUp.header"),
      href: "submission-set-up",
    },
    {
      text: t("sectionSubmissionWindow.header"),
      href: "submission-window",
    },
    {
      text: t("sectionAgencyContact.header"),
      href: "agency-contact",
    },
    {
      text: t("sectionApplicationChecklist.header"),
      href: "application-checklist",
    },
    {
      text: t("sectionNarrativeFormatInstructions.header"),
      href: "narrative-format-instructions",
    },
  ];

  return (
    <div className="bg-white">
      {/* TODO(#10507): remove minh-viewport once the competition page has enough content that sticky nav no longer releases */}
      <div className="grid-container padding-bottom-4 minh-viewport">
        <div className="usa-in-page-nav-container">
          <LeftHandFormNav title={t("leftNavTitle")} fields={navigationItems} />
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
                <Link href={editUrl}>
                  <Button type="button" className="usa-button--outline">
                    {t("button.back")}
                  </Button>
                </Link>
              </div>
              <Link href={overviewUrl}>
                <Button type="button">{t("button.saveAndContinue")}</Button>
              </Link>
              <ModalToggleButton
                modalRef={formModalRef}
                opener
                className="margin-y-2 usa-button usa-button--secondary usa-button--big"
                type="button"
              >
                Open Modal Test
              </ModalToggleButton>
              <FormSelectModal
                competition={competition}
                forms={forms}
                formModalRef={formModalRef}
                submitCompetitionForms={submitCompetitionForms}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
