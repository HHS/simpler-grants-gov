import type { FormDiff, Pinned, Recorded } from "../harness/model.ts";
import { FREE_TEXT_HELP, SHARED_HELP, standardLabel } from "./common.ts";

/** The DAT stars State and Zip but answers "No" in its Required column; both are required only for a US address. */
const conditionalStar = (label: string): Pinned => ({
  plan: label,
  source: `* ${label}`,
  category: "upstream",
  reason:
    "The DAT stars State and Zip / Postal Code but marks them not required, and its help text requires them only when Country is the United States. The plan treats them as conditional, so it does not star them.",
});

const KEY_CONTACT_HELP: Recorded = {
  category: "intentional",
  reason:
    "The Key Contact question words this help more briefly than the DAT. For Project Role it also leaves out “Additional contacts are optional.”",
};

const NINE_DIGIT_HELP: Recorded = {
  category: "intentional",
  reason:
    "The shared Address question's help follows the SF-424 DATs (“nine-digit Postal Code”), which the Key Contacts DAT does not use.",
};

/** Every help text that differs from the DAT, pinned word for word. */
const help: Record<string, Pinned> = {
  // key_contacts[].project_role
  "7-01": {
    ...KEY_CONTACT_HELP,
    plan: "Enter the individual's role on the project (e.g., project manager, fiscal contact).",
    source:
      "Enter the project role of the contact person (e.g., project manager, fiscal contact). Additional contacts are optional.",
  },
  // key_contacts[].name.prefix
  "7-03": {
    ...FREE_TEXT_HELP,
    plan: "Enter the prefix.",
    source:
      "Select the Prefix from the provided list or enter a new Prefix not provided on the list.",
  },
  // key_contacts[].name.first_name
  "7-04": {
    ...SHARED_HELP,
    plan: "Enter the first name.",
    source: "Enter the First Name. This field is required.",
  },
  // key_contacts[].name.last_name
  "7-06": {
    ...SHARED_HELP,
    plan: "Enter the last name.",
    source: "Enter the Last Name. This field is required.",
  },
  // key_contacts[].name.suffix
  "7-07": {
    ...FREE_TEXT_HELP,
    plan: "Enter the suffix.",
    source:
      "Select the Suffix from the provided list or enter a new Suffix not provided on the list.",
  },
  // key_contacts[].organizational_affiliation
  "7-09": {
    ...KEY_CONTACT_HELP,
    plan: "Enter the contact's organizational affiliation.",
    source:
      "Enter the Organizational Affiliation of the person to contact on matters related to this application.",
  },
  // key_contacts[].address.street1
  "7-10": {
    ...SHARED_HELP,
    plan: "Enter the first line of the street address.",
    source:
      "Enter the first line of the Street Address. This field is required.",
  },
  // key_contacts[].address.city
  "7-12": {
    ...SHARED_HELP,
    plan: "Enter the city.",
    source: "Enter the City. This field is required.",
  },
  // key_contacts[].address.state
  "7-14": {
    ...SHARED_HELP,
    plan: "Select the state. This field is required if the country is the United States.",
    source:
      "Select the state, US possession or military code from the provided list. This field is required if Country is the United States.",
  },
  // key_contacts[].address.country
  "7-16": {
    ...SHARED_HELP,
    plan: "Select the country.",
    source:
      "Select the Country from the provided list. This field is required.",
  },
  // key_contacts[].address.zip_code
  "7-17": {
    ...NINE_DIGIT_HELP,
    plan: "Enter the zip / postal code. This field is required if the country is the United States.",
    source:
      "Enter the Postal Code (e.g., ZIP code). This field is required if Country is the United States.",
  },
  // key_contacts[].phone
  "7-18": {
    ...SHARED_HELP,
    plan: "Enter the phone number.",
    source: "Enter the daytime Telephone Number. This field is required.",
  },
  // key_contacts[].email
  "7-20": {
    ...SHARED_HELP,
    plan: "Enter the email address.",
    source: "Enter a valid Email Address. This field is required.",
  },
  // key_contacts[].address.county
  "7-13": {
    ...SHARED_HELP,
    plan: "Enter the county or parish.",
    source: "Enter the County.",
  },
};

/** Title and Organizational Affiliation join Project Role in the Role group, ahead of the name. */
const ROLE_GROUP: Recorded = {
  category: "intentional",
  reason:
    "The form's layout groups Project Role, Title and Organizational Affiliation under a Role heading, so Title and Organizational Affiliation come before the name. The DAT and XSD list them after it, as the data does.",
};

export const DIFF: FormDiff = {
  slug: "key-contacts",
  dat: {
    differingLabels: {
      "7-01": standardLabel("* Project Role", "* Contact 1 Project Role"),
      "7-13": standardLabel("County/Parish", "County"),
      "7-14": conditionalStar("State"),
      "7-17": conditionalStar("Zip / Postal Code"),
      "7-18": standardLabel("* Phone Number", "* Telephone Number"),
      "7-19": standardLabel("Fax Number", "Fax"),
    },
    differingHelp: help,
    outOfOrder: { "7-08": ROLE_GROUP, "7-09": ROLE_GROUP },
  },
};
