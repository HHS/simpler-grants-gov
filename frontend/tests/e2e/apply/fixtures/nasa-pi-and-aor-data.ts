import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";

// Happy-path data for NASA - PI and AOR Supplemental Data Sheet, generated from forms/specs.
// Keys match the field definitions below.

// E2E-NASAPIAORG, seeded by build_automatic_opportunities.py and seed_local_db.py.
export const NASA_PI_AND_AOR_OPPORTUNITY_ID =
  "17281277-7149-4a77-b13e-89fe7e2f344a";

const text = (testId: string, section: string, field: string) => ({
  testId,
  type: "text" as const,
  section,
  field,
});

// The yes/no questions render one radio per answer, named by the field.
const yesNo = (name: string, answer: boolean, field: string) => ({
  selector: `input[name="${name}"][value="${String(answer)}"]`,
  type: "radiobutton" as const,
  section: "Principal Investigator Name",
  field,
});

const AOR = "Authorized Representative Name";
const PI = "Principal Investigator Name";

export const fieldDefinitionsNasaPIAndAOR: FormFillFieldDefinitions = {
  aor_prefix: text("authorized_representative--name--prefix", AOR, "Prefix"),
  aor_first_name: text(
    "authorized_representative--name--first_name",
    AOR,
    "First Name",
  ),
  aor_middle_name: text(
    "authorized_representative--name--middle_name",
    AOR,
    "Middle Name",
  ),
  aor_last_name: text(
    "authorized_representative--name--last_name",
    AOR,
    "Last Name",
  ),
  aor_suffix: text("authorized_representative--name--suffix", AOR, "Suffix"),
  aor_nspires_username: text(
    "authorized_representative--nspires_username",
    AOR,
    "NSPIRES Username",
  ),
  pi_prefix: text("principal_investigator--name--prefix", PI, "Prefix"),
  pi_first_name: text(
    "principal_investigator--name--first_name",
    PI,
    "First Name",
  ),
  pi_last_name: text(
    "principal_investigator--name--last_name",
    PI,
    "Last Name",
  ),
  pi_us_government_participation: yesNo(
    "principal_investigator--us_government_participation",
    true,
    "U.S. Government employee",
  ),
  pi_federal_agency: {
    selector: "#principal_investigator--federal_agency",
    type: "dropdown",
    section: PI,
    field: "U.S. Government agency",
  },
  pi_federal_agency_dollar: text(
    "principal_investigator--federal_agency_dollar",
    PI,
    "Total dollar amount requested",
  ),
  pi_international_participation: yesNo(
    "principal_investigator--international_participation",
    false,
    "Foreign organization employee",
  ),
};

export const nasaPIAndAORHappyPathTestData = {
  aor_prefix: "Ms.",
  aor_first_name: "Alicia",
  aor_middle_name: "M",
  aor_last_name: "Reyes",
  aor_suffix: "Jr.",
  aor_nspires_username: "areyes",
  pi_prefix: "Dr.",
  pi_first_name: "Maria",
  pi_last_name: "Chen",
  pi_us_government_participation: "Yes",
  pi_federal_agency:
    "141: National Oceanic and Atmospheric Administration (NOAA)",
  pi_federal_agency_dollar: "125000.00",
  pi_international_participation: "No",
};

export const NASA_PI_AND_AOR_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName:
    "NASA - Principal Investigator and Authorized Representative Supplemental Data Sheet",
  fields: fieldDefinitionsNasaPIAndAOR,
} as const;
