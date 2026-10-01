"use client";

import { FormType } from "src/types/allFormsResponseTypes";
import { CompetitionFormsSubmitApi } from "src/types/competitionsResponseTypes";

import { useTranslations } from "next-intl";
import { Grid, GridContainer } from "@trussworks/react-uswds";

export function RequiredForms({
  alwaysRequiredForms,
  requiredForms = [],
  formDetails,
}: {
  alwaysRequiredForms: Record<string, boolean>;
  requiredForms?: CompetitionFormsSubmitApi;
  formDetails: FormType[];
}) {
  const t = useTranslations("OpportunityCompetition.sectionRequiredForms");
  const tForm = useTranslations("FormSelectModal");

  return (
    <div
      id="required-forms"
      className="margin-top-4 padding-bottom-4 simpler-page-anchor-offset"
    >
      <h2 className="font-heading-lg margin-top-0 margin-bottom-1">
        {t("header")}
      </h2>
      <p className="font-body-md text-base-dark margin-top-0">
        {t("subHeader")}
      </p>

      <GridContainer className="padding-left-0 padding-right-0">
        <Grid
          row
          className="form-modal-rows form-modal-optional padding-2 margin-bottom-0 bg-base-lightest"
        >
          <Grid col={8} className="text-bold">
            {t("labelForm")}
          </Grid>
          <Grid col={4} className="text-bold text-right">
            {t("labelRequirement")}
          </Grid>
        </Grid>
        {requiredForms.map((form, index) => {
          const alwaysRequired = alwaysRequiredForms[form.form_id] === true;
          const formData = formDetails.find(
            (details) => details.form_id === form.form_id,
          );
          {
            if (!formData) return <span />; // this should never happen
          }
          return (
            <Grid
              row
              className="form-modal-rows form-modal-optional padding-2 margin-bottom-0"
              key={`forms-table-row-${index}`}
            >
              <Grid col={8} className="text-bold">
                <div
                  style={{
                    fontSize: 14,
                  }}
                >
                  {formData.short_name.split("_")[0].substring(0, 25)}{" "}
                  <span
                    style={{
                      color: "#76766A",
                      fontWeight: "normal",
                    }}
                  >
                    v{formData.current_version.major_version}.
                    {formData.current_version.minor_version}
                  </span>
                  {alwaysRequired ? (
                    <span className="always-required-label">
                      {tForm("requiredStates.always")}
                    </span>
                  ) : (
                    <></>
                  )}
                </div>
                <div style={{ fontSize: 16 }}>
                  {formData.name.split(" (")[0]}
                </div>
              </Grid>
              <Grid col={4} className="text-right">
                {form.is_required ? (
                  <span className="bg-base-lightest padding-1">
                    {tForm("requiredStates.required")}
                  </span>
                ) : (
                  <span className="bg-base-lightest padding-1">
                    {tForm("requiredStates.conditional")}
                  </span>
                )}
              </Grid>
            </Grid>
          );
        })}
      </GridContainer>
    </div>
  );
}
