import type { FormDiff, Pinned, Recorded } from "../harness/model.ts";
import {
  conditionalStar,
  emailMinLength,
  FREE_TEXT_HELP,
  SHARED_HELP,
  standardLabel,
} from "./common.ts";

const KEY_CONTACT_HELP: Recorded = {
  category: "intentional",
  reason:
    "The form uses the help text of SGG's existing Key Contacts form, which is shorter than the DAT's. For Project Role it also leaves out “Additional contacts are optional.”",
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
    ...SHARED_HELP,
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

/** Title and Organizational Affiliation come before the name, with Project Role. */
const ROLE_FIRST: Recorded = {
  category: "intentional",
  reason:
    "The form asks for Project Role, Title and Organizational Affiliation before the name, as SGG's existing Key Contacts form does. The DAT and XSD list Title and Organizational Affiliation after it.",
};

export const DIFF: FormDiff = {
  slug: "key-contacts",
  dat: {
    differingLabels: {
      "7-01": standardLabel("* Project Role", "* Contact 1 Project Role"),
      "7-10": standardLabel("* Street 1", "* Street1"),
      "7-11": standardLabel("Street 2", "Street2"),
      "7-13": standardLabel("County/Parish", "County"),
      "7-14": conditionalStar("State"),
      "7-17": conditionalStar("Zip / Postal Code"),
      "7-18": standardLabel("* Phone Number", "* Telephone Number"),
      "7-19": standardLabel("Fax Number", "Fax"),
    },
    differingHelp: help,
    outOfOrder: { "7-08": ROLE_FIRST, "7-09": ROLE_FIRST },
  },
  xsd: { differingRules: emailMinLength(["RoleOnProject/ContactEmail"]) },
  jsonSchemaVsXsd: { differingRules: emailMinLength(["key_contacts[].email"]) },
};
