import type { FillFormConfig } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";

export const RR_OTHER_PROJECT_INFO_FORM_MATCHER =
  /Research And Related Other Project Information/i;

const no = (id: string, field: string) => ({
  selector: `input[name="${id}"][value="false"]`,
  printTestId: id,
  type: "radiobutton" as const,
  field,
});

export const RR_OTHER_PROJECT_INFO_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: RR_OTHER_PROJECT_INFO_FORM_MATCHER,
  fields: {
    human_subjects_involved: no(
      "human_subjects_involved",
      "1. Are Human Subjects Involved?",
    ),
    vertebrate_animals_used: no(
      "vertebrate_animals_used",
      "2. Are Vertebrate Animals Used?",
    ),
    proprietary_information_included: no(
      "proprietary_information_included",
      "3. Is proprietary/privileged information included in the application?",
    ),
    environmental_impact: no(
      "environmental_impact",
      "4.a. Does this Project Have an Actual or Potential Impact - positive or negative - on the environment?",
    ),
    historic_site_designated_or_eligible: no(
      "historic_site_designated_or_eligible",
      "5.  Is the research performance site designated, or eligible to be designated, as a historic place?",
    ),
    international_activities_involved: no(
      "international_activities_involved",
      "6. Does this project involve activities outside of the United States or partnerships with international collaborators?",
    ),
  },
} satisfies FillFormConfig;

export const RR_OTHER_PROJECT_INFO_REQUIRED_FIELD_ERRORS = [
  {
    fieldId: "human_subjects_involved",
    message: "1. Are Human Subjects Involved is required",
  },
  {
    fieldId: "vertebrate_animals_used",
    message: "2. Are Vertebrate Animals Used is required",
  },
  {
    fieldId: "proprietary_information_included",
    message:
      "3. Is proprietary/privileged information included in the application is required",
  },
  {
    fieldId: "environmental_impact",
    message:
      "4.a. Does this Project Have an Actual or Potential Impact - positive or negative - on the environment is required",
  },
  {
    fieldId: "historic_site_designated_or_eligible",
    message:
      "5.  Is the research performance site designated, or eligible to be designated, as a historic place is required",
  },
  {
    fieldId: "international_activities_involved",
    message:
      "6. Does this project involve activities outside of the United States or partnerships with international collaborators is required",
  },
];
