import type { FormDiff, Pinned, Recorded } from "../harness/model.ts";
import { SHARED_HELP } from "./common.ts";

const choice: Recorded = {
  category: "intentional",
  reason:
    "The DAT gives each checkbox its own row. The form collects the choices in one multi-select per person and writes one XML element for each selected value.",
};
const memberRequired: Pinned = {
  plan: "yes",
  source: "no",
  category: "upstream",
  reason:
    "First and last name are required for each co-director an applicant adds. The whole co-director list may be omitted.",
};
const raceLimit: Pinned = {
  plan: 5,
  source: 20,
  category: "intentional",
  reason:
    "The plan gives the five-choice limit for one person. Across four co-directors the maximum is twenty.",
};
const disabilityLimit: Pinned = {
  plan: 4,
  source: 16,
  category: "intentional",
  reason:
    "The plan gives the four-choice limit for one person. Across four co-directors the maximum is sixteen.",
};
const namedEnum = (source: string): Pinned => ({
  plan: null,
  source,
  category: "intentional",
  reason:
    "The plan lists the choices. The XSD also names their type. The schema-to-XSD check compares the choice values.",
});
export const DIFF: FormDiff = {
  slug: "research-related-personal-data",
  xml: "xml-mapping",
  dat: {
    absentFromPlan: {
      "03-01": choice,
      "03-02": choice,
      "03-03": choice,
      "03-04": choice,
      "03-05": choice,
      "03-06": choice,
      "05-01": choice,
      "05-02": choice,
      "05-03": choice,
      "05-04": choice,
      "05-05": choice,
      "05-06": choice,
      "10-01": choice,
      "10-02": choice,
      "10-03": choice,
      "10-04": choice,
      "10-05": choice,
      "10-06": choice,
      "12-01": choice,
      "12-02": choice,
      "12-03": choice,
      "12-04": choice,
      "12-05": choice,
      "12-06": choice,
    },
    differingHelp: {
      "01-01": {
        ...SHARED_HELP,
        plan: "Enter the prefix.",
        source:
          "Enter the prefix (e.g., Mr., Mrs., Rev.) for the name of the PD/PI. Pre-populated from SF 424 R&R.",
      },
      "01-02": {
        ...SHARED_HELP,
        plan: "Enter the first name.",
        source:
          "Enter the first (given) name of the PD/PI. This field is required. Pre-populated from SF 424 R&R.",
      },
      "01-03": {
        ...SHARED_HELP,
        plan: "Enter the middle name.",
        source:
          "Enter the middle name of the PD/PI. Pre-populated from SF 424 R&R.",
      },
      "01-04": {
        ...SHARED_HELP,
        plan: "Enter the last name.",
        source:
          "Enter the last (family) name of the PD/PI. This field is required. Pre-populated from SF-424 R&R.",
      },
      "01-05": {
        ...SHARED_HELP,
        plan: "Enter the suffix.",
        source:
          "Enter the suffix (e.g., Jr, Sr, PhD) for the name of the PD/PI. Pre-populated from SF 424 R&R.",
      },
      "08-01": {
        ...SHARED_HELP,
        plan: "Enter the prefix.",
        source:
          "Enter the prefix (e.g., Mr., Mrs., Rev.) for the name of the PD/PI.",
      },
      "08-02": {
        ...SHARED_HELP,
        plan: "Enter the first name.",
        source:
          "Enter the first (given) name of the PD/PI. This field is required.",
      },
      "08-03": {
        ...SHARED_HELP,
        plan: "Enter the middle name.",
        source: "Enter the middle name of the PD/PI.",
      },
      "08-04": {
        ...SHARED_HELP,
        plan: "Enter the last name.",
        source:
          "Enter the last (family) name of the PD/PI. This field is required.",
      },
      "08-05": {
        ...SHARED_HELP,
        plan: "Enter the suffix.",
        source:
          "Enter the suffix (e.g., Jr, Sr, PhD) for the name of the PD/PI.",
      },
    },
  },
  xsd: {
    differingRules: {
      "ProjectDirector/Gender/enumType": namedEnum("GenderType"),
      "ProjectDirector/Race/enumType": namedEnum("RaceType"),
      "ProjectDirector/Ethnicity/enumType": namedEnum("EthnicityType"),
      "ProjectDirector/DisabilityStatus/enumType": namedEnum(
        "DisablilityStatusType",
      ),
      "ProjectDirector/Citizenship/enumType": namedEnum("CitizenshipType"),
      "Co-ProjectDirector/Name/FirstName/required": memberRequired,
      "Co-ProjectDirector/Name/LastName/required": memberRequired,
      "Co-ProjectDirector/Gender/enumType": namedEnum("GenderType"),
      "Co-ProjectDirector/Race/enumType": namedEnum("RaceType"),
      "Co-ProjectDirector/Ethnicity/enumType": namedEnum("EthnicityType"),
      "Co-ProjectDirector/DisabilityStatus/enumType": namedEnum(
        "DisablilityStatusType",
      ),
      "Co-ProjectDirector/Citizenship/enumType": namedEnum("CitizenshipType"),
      "Co-ProjectDirector/Race/maxOccurs": raceLimit,
      "Co-ProjectDirector/DisabilityStatus/maxOccurs": disabilityLimit,
    },
  },
  jsonSchema: {
    differingRules: {
      "co_project_director[].name.first_name/required": memberRequired,
      "co_project_director[].name.last_name/required": memberRequired,
      "co_project_director[].race[]/maxOccurs": raceLimit,
      "co_project_director[].disability_status[]/maxOccurs": disabilityLimit,
    },
  },
};
