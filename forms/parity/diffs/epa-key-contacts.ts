import type { FormDiff, Pinned, Recorded } from "../harness/model.ts";
import { FREE_TEXT_HELP, SHARED_HELP, standardLabel } from "./common.ts";

const ROLES = [
  "authorized_representative",
  "payee",
  "administrative_contact",
  "project_manager",
];

const addressOrder: Record<string, Recorded> = Object.fromEntries(
  ROLES.map((role) => [
    `${role}.address.country`,
    {
      category: "intentional",
      reason:
        "The PDF, DAT and current SGG form put ZIP/Postal Code before Country. The spec reuses the shared Address question, which puts Country first (as Key Contacts does), rather than reordering address fields per form.",
    },
  ]),
);

const NOT_ASKED: Recorded = {
  category: "intentional",
  reason:
    "ContactPersonDataTypeV3 permits County and Province, but neither appears on the official PDF or in the current SGG form, so the form does not ask for them.",
};

/** County and Province for every role, keyed by `path(role, field)`. */
const notAsked = (path: (role: number, field: string) => string) =>
  Object.fromEntries(
    ROLES.flatMap((_, role) =>
      ["County", "Province"].map((field) => [path(role, field), NOT_ASKED]),
    ),
  );

const XSD_ROLES = [
  "AuthorizedRepresentative",
  "Payee",
  "AdminstrativeContact",
  "ProjectManager",
];

const US_ZIP_HELP: Recorded = {
  category: "intentional",
  reason:
    "The shared Person question requires Zip / Postal Code for a US address, and the Address question's help says so. The EPA DAT neither states nor marks that rule.",
};

/** Every help text that differs from the DAT, pinned word for word. */
const help: Record<string, Pinned> = {
  // authorized_representative.name.prefix
  "B1-03": {
    ...FREE_TEXT_HELP,
    plan: "Enter the prefix.",
    source:
      "Please select the Authorized Representative's Prefix from the provided list or enter a new Prefix not provided on the list.",
  },
  // authorized_representative.name.first_name
  "B1-04": {
    ...SHARED_HELP,
    plan: "Enter the first name.",
    source: "Please enter the Authorized Representative's First Name.",
  },
  // authorized_representative.name.middle_name
  "B1-05": {
    ...SHARED_HELP,
    plan: "Enter the middle name.",
    source: "Please enter the Authorized Representative's Middle Name.",
  },
  // authorized_representative.name.last_name
  "B1-06": {
    ...SHARED_HELP,
    plan: "Enter the last name.",
    source: "Please enter the Authorized Representative's Last Name.",
  },
  // authorized_representative.name.suffix
  "B1-07": {
    ...FREE_TEXT_HELP,
    plan: "Enter the suffix.",
    source:
      "Please select the Authorized Representative's Suffix from the provided list or enter a new Suffix not provided on the list.",
  },
  // authorized_representative.title
  "B1-08": {
    ...SHARED_HELP,
    plan: "Enter the position title.",
    source: "Please enter the Authorized Representative's Title.",
  },
  // authorized_representative.address.street1
  "B1-10": {
    ...SHARED_HELP,
    plan: "Enter the first line of the street address.",
    source:
      "Please enter the first line of the Authorized Representative's Street Address.",
  },
  // authorized_representative.address.street2
  "B1-11": {
    ...SHARED_HELP,
    plan: "Enter the second line of the street address.",
    source:
      "Please enter the second line of the Authorized Representative's Street Address.",
  },
  // authorized_representative.address.city
  "B1-12": {
    ...SHARED_HELP,
    plan: "Enter the city.",
    source: "Please enter the Authorized Representative's City.",
  },
  // authorized_representative.address.state
  "B1-13": {
    ...SHARED_HELP,
    plan: "Select the state. This field is required if the country is the United States.",
    source:
      "Please enter the Authorized Representative's State. Select from the pull down menu.",
  },
  // authorized_representative.address.zip_code
  "B1-14": {
    ...US_ZIP_HELP,
    plan: "Enter the zip / postal code. This field is required if the country is the United States.",
    source: "Please enter the Authorized Representative's Zip / Postal Code.",
  },
  // authorized_representative.address.country
  "B1-15": {
    ...SHARED_HELP,
    plan: "Select the country.",
    source:
      "Please enter the Authorized Representative's Country. Select from the pull down menu.",
  },
  // authorized_representative.phone
  "B1-16": {
    ...SHARED_HELP,
    plan: "Enter the phone number.",
    source: "Please enter the Authorized Representative's Phone Number.",
  },
  // authorized_representative.fax
  "B1-17": {
    ...SHARED_HELP,
    plan: "Enter the fax number.",
    source: "Please enter the Authorized Representative's Fax Number.",
  },
  // authorized_representative.email
  "B1-18": {
    ...SHARED_HELP,
    plan: "Enter the email address.",
    source: "Please enter the Authorized Representative's E-mail Address.",
  },
  // payee.name.prefix
  "B2-03": {
    ...FREE_TEXT_HELP,
    plan: "Enter the prefix.",
    source:
      "Please select the Payee's Prefix from the provided list or enter a new Prefix not provided on the list.",
  },
  // payee.name.first_name
  "B2-04": {
    ...SHARED_HELP,
    plan: "Enter the first name.",
    source: "Please enter the Payee's First Name.",
  },
  // payee.name.middle_name
  "B2-05": {
    ...SHARED_HELP,
    plan: "Enter the middle name.",
    source: "Please enter the Payee's Middle Name.",
  },
  // payee.name.last_name
  "B2-06": {
    ...SHARED_HELP,
    plan: "Enter the last name.",
    source: "Please enter the Payee's Last Name.",
  },
  // payee.name.suffix
  "B2-07": {
    ...FREE_TEXT_HELP,
    plan: "Enter the suffix.",
    source:
      "Please select the Payee's Suffix from the provided list or enter a new Suffix not provided on the list.",
  },
  // payee.title
  "B2-08": {
    ...SHARED_HELP,
    plan: "Enter the position title.",
    source: "Please enter the Payee's Title.",
  },
  // payee.address.street1
  "B2-10": {
    ...SHARED_HELP,
    plan: "Enter the first line of the street address.",
    source: "Please enter the first line of the Payee's Street Address.",
  },
  // payee.address.street2
  "B2-11": {
    ...SHARED_HELP,
    plan: "Enter the second line of the street address.",
    source: "Please enter the second line of the Payee's Street Address.",
  },
  // payee.address.city
  "B2-12": {
    ...SHARED_HELP,
    plan: "Enter the city.",
    source: "Please enter the Payee's City.",
  },
  // payee.address.state
  "B2-13": {
    ...SHARED_HELP,
    plan: "Select the state. This field is required if the country is the United States.",
    source: "Please enter the Payee's State. Select from the pull down menu.",
  },
  // payee.address.zip_code
  "B2-14": {
    ...US_ZIP_HELP,
    plan: "Enter the zip / postal code. This field is required if the country is the United States.",
    source: "Please enter the Payee's Zip / Postal Code.",
  },
  // payee.address.country
  "B2-15": {
    ...SHARED_HELP,
    plan: "Select the country.",
    source: "Please enter the Payee's Country. Select from the pull down menu.",
  },
  // payee.phone
  "B2-16": {
    ...SHARED_HELP,
    plan: "Enter the phone number.",
    source: "Please enter the Payee's Phone Number.",
  },
  // payee.fax
  "B2-17": {
    ...SHARED_HELP,
    plan: "Enter the fax number.",
    source: "Please enter the Payee's Fax Number.",
  },
  // payee.email
  "B2-18": {
    ...SHARED_HELP,
    plan: "Enter the email address.",
    source: "Please enter the Payee's E-mail Address.",
  },
  // administrative_contact.name.prefix
  "B3-03": {
    ...FREE_TEXT_HELP,
    plan: "Enter the prefix.",
    source:
      "Please select the Administrative Contact's Prefix from the provided list or enter a new Prefix not provided on the list.",
  },
  // administrative_contact.name.first_name
  "B3-04": {
    ...SHARED_HELP,
    plan: "Enter the first name.",
    source: "Please enter the Administrative Contact's First Name.",
  },
  // administrative_contact.name.middle_name
  "B3-05": {
    ...SHARED_HELP,
    plan: "Enter the middle name.",
    source: "Please enter the Administrative Contact's Middle Name.",
  },
  // administrative_contact.name.last_name
  "B3-06": {
    ...SHARED_HELP,
    plan: "Enter the last name.",
    source: "Please enter the Administrative Contact's Last Name.",
  },
  // administrative_contact.name.suffix
  "B3-07": {
    ...FREE_TEXT_HELP,
    plan: "Enter the suffix.",
    source:
      "Please select the Administrative Contact's Suffix from the provided list or enter a new Suffix not provided on the list.",
  },
  // administrative_contact.title
  "B3-08": {
    ...SHARED_HELP,
    plan: "Enter the position title.",
    source: "Please enter the Administrative Contact's Title.",
  },
  // administrative_contact.address.street1
  "B3-10": {
    ...SHARED_HELP,
    plan: "Enter the first line of the street address.",
    source:
      "Please enter the first line of the Administrative Contact's Street Address.",
  },
  // administrative_contact.address.street2
  "B3-11": {
    ...SHARED_HELP,
    plan: "Enter the second line of the street address.",
    source:
      "Please enter the second line of the Administrative Contact's Street Address.",
  },
  // administrative_contact.address.city
  "B3-12": {
    ...SHARED_HELP,
    plan: "Enter the city.",
    source: "Please enter the Administrative Contact's City.",
  },
  // administrative_contact.address.state
  "B3-13": {
    ...SHARED_HELP,
    plan: "Select the state. This field is required if the country is the United States.",
    source:
      "Please enter the Administrative Contact's State. Select from the pull down menu.",
  },
  // administrative_contact.address.zip_code
  "B3-14": {
    ...US_ZIP_HELP,
    plan: "Enter the zip / postal code. This field is required if the country is the United States.",
    source: "Please enter the Administrative Contact's Zip / Postal Code.",
  },
  // administrative_contact.address.country
  "B3-15": {
    ...SHARED_HELP,
    plan: "Select the country.",
    source:
      "Please enter the Administrative Contact's Country. Select from the pull down menu.",
  },
  // administrative_contact.phone
  "B3-16": {
    ...SHARED_HELP,
    plan: "Enter the phone number.",
    source: "Please enter the Administrative Contact's Phone Number.",
  },
  // administrative_contact.fax
  "B3-17": {
    ...SHARED_HELP,
    plan: "Enter the fax number.",
    source: "Please enter the Administrative Contact's Fax Number.",
  },
  // administrative_contact.email
  "B3-18": {
    ...SHARED_HELP,
    plan: "Enter the email address.",
    source: "Please enter the Administrative Contact's E-mail Address.",
  },
  // project_manager.name.prefix
  "B4-03": {
    ...FREE_TEXT_HELP,
    plan: "Enter the prefix.",
    source:
      "Please select the Project Manager's Prefix from the provided list or enter a new Prefix not provided on the list.",
  },
  // project_manager.name.first_name
  "B4-04": {
    ...SHARED_HELP,
    plan: "Enter the first name.",
    source: "Please enter the Project Manager's First Name.",
  },
  // project_manager.name.middle_name
  "B4-05": {
    ...SHARED_HELP,
    plan: "Enter the middle name.",
    source: "Please enter the Project Manager's Middle Name.",
  },
  // project_manager.name.last_name
  "B4-06": {
    ...SHARED_HELP,
    plan: "Enter the last name.",
    source: "Please enter the Project Manager's Last Name.",
  },
  // project_manager.name.suffix
  "B4-07": {
    ...FREE_TEXT_HELP,
    plan: "Enter the suffix.",
    source:
      "Please select the Project Manager's Suffix from the provided list or enter a new Suffix not provided on the list.",
  },
  // project_manager.title
  "B4-08": {
    ...SHARED_HELP,
    plan: "Enter the position title.",
    source: "Please enter the Project Manager's Title.",
  },
  // project_manager.address.street1
  "B4-10": {
    ...SHARED_HELP,
    plan: "Enter the first line of the street address.",
    source:
      "Please enter the first line of the Project Manager's Street Address.",
  },
  // project_manager.address.street2
  "B4-11": {
    ...SHARED_HELP,
    plan: "Enter the second line of the street address.",
    source:
      "Please enter the second line of the Project Manager's Street Address.",
  },
  // project_manager.address.city
  "B4-12": {
    ...SHARED_HELP,
    plan: "Enter the city.",
    source: "Please enter the Project Manager's City.",
  },
  // project_manager.address.state
  "B4-13": {
    ...SHARED_HELP,
    plan: "Select the state. This field is required if the country is the United States.",
    source:
      "Please enter the Project Manager's State. Select from the pull down menu.",
  },
  // project_manager.address.zip_code
  "B4-14": {
    ...US_ZIP_HELP,
    plan: "Enter the zip / postal code. This field is required if the country is the United States.",
    source: "Please enter the Project Manager's Zip / Postal Code.",
  },
  // project_manager.address.country
  "B4-15": {
    ...SHARED_HELP,
    plan: "Select the country.",
    source:
      "Please enter the Project Manager's Country. Select from the pull down menu.",
  },
  // project_manager.phone
  "B4-16": {
    ...SHARED_HELP,
    plan: "Enter the phone number.",
    source: "Please enter the Project Manager's Phone Number.",
  },
  // project_manager.fax
  "B4-17": {
    ...SHARED_HELP,
    plan: "Enter the fax number.",
    source: "Please enter the Project Manager's Fax Number.",
  },
  // project_manager.email
  "B4-18": {
    ...SHARED_HELP,
    plan: "Enter the email address.",
    source: "Please enter the Project Manager's E-mail Address.",
  },
};

export const DIFF: FormDiff = {
  slug: "epa-key-contacts-form",
  dat: {
    differingLabels: Object.fromEntries(
      ["B1", "B2", "B3", "B4"].flatMap((block) => [
        [`${block}-10`, standardLabel("Street 1", "Street1")],
        [`${block}-11`, standardLabel("Street 2", "Street2")],
        [`${block}-18`, standardLabel("Email", "E-mail Address")],
      ]),
    ),
    differingHelp: help,
  },
  xsd: {
    absentFromPlan: notAsked(
      (role, field) => `${XSD_ROLES[role]}/Address/${field}`,
    ),
  },
  jsonSchema: {
    absentFromPlan: notAsked(
      (role, field) => `${ROLES[role]}.address.${field.toLowerCase()}`,
    ),
  },
  xmlMapping: {
    absentFromPlan: notAsked(
      (role, field) =>
        `${ROLES[role]}.address.${field.toLowerCase()} -> ${XSD_ROLES[role]}/Address/${field}`,
    ),
  },
  uiSchema: { outOfOrder: addressOrder },
};
