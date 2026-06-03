"use client";

import { useTranslations } from "next-intl";
import { Button } from "@trussworks/react-uswds";

import LeftHandFormNav from "src/components/core/forms/LeftHandFormNav";
import { OpenAndCloseDates } from "src/components/opportunities/competition/sections/OpenAndCloseDates";
import { SubmissionSetUp } from "src/components/opportunities/competition/sections/SubmissionSetUp";

export function CompetitionForm() {
  const t = useTranslations("OpportunityCompetition.sections");

  const navigationItems = [
    {
      text: t("applicationRequirements"),
      href: "application-requirements",
    },
    { text: t("submissionSetUp"), href: "submission-set-up" },
    { text: t("openAndCloseDates"), href: "open-and-close-dates" },
    {
      text: t("applicationChecklist"),
      href: "application-checklist",
    },
    {
      text: t("narrativeFormatInstructions"),
      href: "narrative-format-instructions",
    },
  ];

  return (
    <div className="bg-white">
      {/* TODO(#10507): remove minh-viewport once the competition page has enough content that sticky nav no longer releases */}
      <div className="grid-container padding-bottom-4 minh-viewport">
        <div className="usa-in-page-nav-container">
          <LeftHandFormNav title={t("navTitle")} fields={navigationItems} />
          <section className="order-2 width-full maxw-tablet-xl padding-top-4">
            <div
              id="application-requirements"
              className="padding-bottom-4 border-bottom border-base-lighter simpler-page-anchor-offset"
            >
              <h2 className="font-heading-xl margin-top-0 margin-bottom-1">
                {t("applicationRequirements")}
              </h2>
              <p className="font-body-lg text-base margin-top-0">
                {t("applicationRequirementsSubheader")}
              </p>
              <SubmissionSetUp />
              <OpenAndCloseDates />
            </div>
            <div className="display-flex flex-justify margin-top-4">
              <div className="display-flex gap-2">
                <Button type="button" className="usa-button--outline">
                  {t("back")}
                </Button>
                <Button type="button" className="usa-button--outline">
                  {t("saveAndFinishLater")}
                </Button>
              </div>
              <Button type="button">{t("saveAndContinue")}</Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
