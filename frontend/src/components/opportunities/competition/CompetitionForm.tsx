"use client";

import { useTranslations } from "next-intl";
import { Button } from "@trussworks/react-uswds";

import ApplyFormNav from "src/components/applyForm/ApplyFormNav";
import { OpenAndCloseDates } from "src/components/opportunities/competition/sections/OpenAndCloseDates";
import { SubmissionSetUp } from "src/components/opportunities/competition/sections/SubmissionSetUp";

export function CompetitionForm() {
  const t = useTranslations("OpportunityCompetition");

  const navigationItems = [
    {
      text: t("sections.applicationRequirements"),
      href: "application-requirements",
    },
    { text: t("sections.submissionSetUp"), href: "submission-set-up" },
    { text: t("sections.openAndCloseDates"), href: "open-and-close-dates" },
    {
      text: t("sections.applicationChecklist"),
      href: "application-checklist",
    },
    {
      text: t("sections.narrativeFormatInstructions"),
      href: "narrative-format-instructions",
    },
  ];

  return (
    <div className="bg-white">
      <div className="grid-container padding-bottom-4">
        <div className="usa-in-page-nav-container">
          <ApplyFormNav title="" fields={navigationItems} />
          <section className="order-2 width-full maxw-tablet-xl padding-top-4">
            <div
              id="application-requirements"
              className="padding-bottom-4 border-bottom border-base-lighter simpler-page-anchor-offset"
            >
              <h2 className="font-heading-xl margin-top-0 margin-bottom-1">
                {t("sections.applicationRequirements")}
              </h2>
              <p className="font-body-lg text-base margin-top-0">
                {t("sections.applicationRequirementsSubheader")}
              </p>
              <SubmissionSetUp />
              <OpenAndCloseDates />
            </div>
            <div className="display-flex flex-justify margin-top-4">
              <div className="display-flex gap-2">
                <Button type="button" className="usa-button--outline">
                  {t("sections.back")}
                </Button>
                <Button type="button" className="usa-button--outline">
                  {t("sections.saveAndFinishLater")}
                </Button>
              </div>
              <Button type="button">{t("sections.saveAndContinue")}</Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
