import path from "path";
import type {
  FieldType,
  FormFillFieldDefinitions,
} from "tests/e2e/utils/common/types";

// Shared by the Senior/Key Person forms generated from forms/specs. Each person's answers
// sit under the same paths, e.g. principal_investigator--name--first_name or
// senior_key_persons[0]--name--first_name, so one builder describes each person.

const TEST_UPLOAD_FILE = path.resolve(
  __dirname,
  "../../test-upload-files/sample-upload-kb.pdf",
);

/** The questions every Senior/Key Person profile asks, by path below the person. */
const PROFILE_FIELDS: Record<string, readonly [FieldType, string]> = {
  "name--prefix": ["text", "Prefix"],
  "name--first_name": ["text", "First Name"],
  "name--middle_name": ["text", "Middle Name"],
  "name--last_name": ["text", "Last Name"],
  "name--suffix": ["text", "Suffix"],
  title: ["text", "Position/Title"],
  department: ["text", "Department"],
  division: ["text", "Division"],
  project_role: ["dropdown", "Project Role"],
  "address--street1": ["text", "Street 1"],
  "address--street2": ["text", "Street 2"],
  "address--city": ["text", "City"],
  "address--county": ["text", "County"],
  "address--state": ["dropdown", "State"],
  "address--country": ["dropdown", "Country"],
  "address--zip_code": ["text", "Zip Code"],
  phone: ["text", "Phone Number"],
  fax: ["text", "Fax Number"],
  email: ["text", "E-mail"],
};

/**
 * Field definitions for one person, e.g. `personFields("senior_key_persons[0]", ...)`.
 * `extraFields` are the form's own questions, and `documents` its attachments.
 */
export function personFields(
  person: string,
  section: string,
  extraFields: Record<string, readonly [FieldType, string]>,
  documents: Record<string, string>,
): FormFillFieldDefinitions {
  const definitions: FormFillFieldDefinitions = {};
  for (const [field, [type, label]] of Object.entries({
    ...PROFILE_FIELDS,
    ...extraFields,
  })) {
    const id = `${person}--${field}`;
    definitions[id] =
      type === "dropdown"
        ? { selector: `[id="${id}"]`, type, section, field: label }
        : { testId: id, type, section, field: label };
  }
  for (const [field, label] of Object.entries(documents)) {
    const id = `${person}--${field}`;
    definitions[id] = {
      selector: `input[name="${id}-visible"][type="file"]`,
      type: "file",
      section,
      field: label,
    };
  }
  return definitions;
}

/** Answers for one person's profile, with a file for each of `documents`. */
export function personAnswers(
  person: string,
  initials: string,
  projectRole: string,
  extraAnswers: Record<string, string>,
  documents: Record<string, string>,
): Record<string, string> {
  const answers: Record<string, string> = {
    "name--prefix": "Dr.",
    "name--first_name": `${initials} FIRST NAME`,
    "name--middle_name": `${initials} MIDDLE NAME`,
    "name--last_name": `${initials} LAST NAME`,
    "name--suffix": "Jr.",
    title: `${initials} TITLE`,
    department: `${initials} DEPARTMENT`,
    division: `${initials} DIVISION`,
    project_role: projectRole,
    "address--street1": `${initials} STREET1`,
    "address--street2": `${initials} STREET2`,
    "address--city": `${initials} CITY`,
    "address--county": `${initials} COUNTY`,
    "address--state": "AL: Alabama",
    "address--country": "United States",
    "address--zip_code": "123450000",
    phone: "1234567890",
    fax: "1234567890",
    email: "simpler-grants-e2e-tester@navapbc.com",
    ...extraAnswers,
  };
  for (const field of Object.keys(documents)) {
    answers[field] = TEST_UPLOAD_FILE;
  }
  return Object.fromEntries(
    Object.entries(answers).map(([field, value]) => [
      `${person}--${field}`,
      value,
    ]),
  );
}
