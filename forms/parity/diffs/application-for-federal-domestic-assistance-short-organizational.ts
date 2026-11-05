import type { FormDiff } from "../harness/model.ts";
import { BANK_WORDING } from "./common.ts";

const datSlots = {
  category: "intentional",
  reason:
    "The maintained SGG form collects one ordered list of up to three types. The plan lists the three numbered DAT slots in source_bindings.",
} as const;
const xsdSlots = {
  category: "intentional",
  reason:
    "The plan represents the three named XSD elements as one ordered list. It retains each element in source_bindings.",
} as const;
const wireSlots = {
  category: "gap",
  reason:
    "The TypeSpec emitter cannot fan one array into ApplicantTypeCode1–3 or apply the maintained API H-label transform per item. Wire parity is pending.",
} as const;
const draft = {
  category: "intentional",
  reason:
    "This submission field is optional in a draft. SGG fills it at submission and the source requires it in final XML.",
} as const;
const email = {
  category: "intentional",
  reason:
    "The email format already rejects empty values in the form schema. The XSD states a separate minimum length of one.",
} as const;
const bool = {
  category: "intentional",
  reason:
    "The form stores a Boolean. The authored XML transform writes the source Yes/No enumeration.",
} as const;
const zipState = {
  category: "upstream",
  reason:
    "The DAT marks the field required and its instructions limit that requirement to US addresses. The shared address makes it conditional.",
} as const;
const contactOrder = {
  category: "intentional",
  reason:
    "The shared Person question groups the name and address before phone, fax and email. The authored XML mapping keeps the source sequence.",
} as const;
const shortContact = {
  category: "gap",
  reason:
    "Existing SGG requires contact details in both roles. The XSD permits omission, and the DAT says to skip the second role when the director is the contact. Copy and omission remain source decisions.",
} as const;
const shortRole = {
  category: "upstream",
  reason:
    "The DAT and maintained SGG require the project director’s title, phone and email. The shared XSD type permits omission.",
} as const;
const shortDateDat = {
  category: "gap",
  reason:
    "DAT row 3-1 describes the received date as a label. The original XSD requires the element and the maintained API owns population and its empty wire value.",
} as const;
const url = {
  category: "gap",
  reason:
    "The maintained SGG form allows a 250-character string. The DAT specifies 50 characters and the XSD uses anyURI. Reconcile that limit and admission before integration.",
} as const;

export const DIFF: FormDiff = {
  slug: "application-for-federal-domestic-assistance-short-organizational",
  xml: "xml-mapping",
  wording: BANK_WORDING,
  dat: {
    absentFromPlan: {
      "5d-1": datSlots,
      "5d-2": datSlots,
      "5d-3": datSlots,
    },
    absentFromSource: {
      "3-1": shortDateDat,
    },
    outOfOrder: {
      "7-10": contactOrder,
      "7-11": contactOrder,
      "7-09": contactOrder,
      "8-11": contactOrder,
      "8-12": contactOrder,
      "8-10": contactOrder,
    },
    differingRules: {
      "5b-6/required": { ...zipState, plan: "conditional", source: "yes" },
      "5b-9/required": { ...zipState, plan: "conditional", source: "yes" },
      "5c-2/maxLength": { ...url, plan: 250, source: 50 },
      "7-16/required": { ...zipState, plan: "conditional", source: "yes" },
      "7-19/required": { ...zipState, plan: "conditional", source: "yes" },
      "8-17/required": { ...zipState, plan: "conditional", source: "yes" },
      "8-20/required": { ...zipState, plan: "conditional", source: "yes" },
      "9-14/required": { ...draft, plan: "conditional", source: "yes" },
      "9-15/required": { ...draft, plan: "conditional", source: "yes" },
    },
  },
  xsd: {
    absentFromPlan: {
      ApplicantTypeCode1: xsdSlots,
      ApplicantTypeCode2: xsdSlots,
      ApplicantTypeCode3: xsdSlots,
    },
    differingRules: {
      "DateReceived/required": { ...draft, plan: "conditional", source: "yes" },
      "ApplicantWebAddress/minLength": { ...url, plan: 1, source: null },
      "ApplicantWebAddress/maxLength": { ...url, plan: 250, source: null },
      "ProjectDirectorGroup/Title/required": {
        ...shortRole,
        plan: "yes",
        source: "no",
      },
      "ProjectDirectorGroup/Phone/required": {
        ...shortRole,
        plan: "yes",
        source: "no",
      },
      "ProjectDirectorGroup/Email/required": {
        ...shortRole,
        plan: "yes",
        source: "no",
      },
      "ProjectDirectorGroup/Email/minLength": {
        ...email,
        plan: null,
        source: 1,
      },
      "SameAsProjectDirector/enumType": {
        ...bool,
        plan: null,
        source: "YesNoDataType",
      },
      "ContactPersonGroup/Name/FirstName/required": {
        ...shortContact,
        plan: "yes",
        source: "no",
      },
      "ContactPersonGroup/Name/LastName/required": {
        ...shortContact,
        plan: "yes",
        source: "no",
      },
      "ContactPersonGroup/Title/required": {
        ...shortContact,
        plan: "yes",
        source: "no",
      },
      "ContactPersonGroup/Address/Street1/required": {
        ...shortContact,
        plan: "yes",
        source: "no",
      },
      "ContactPersonGroup/Address/City/required": {
        ...shortContact,
        plan: "yes",
        source: "no",
      },
      "ContactPersonGroup/Address/Country/required": {
        ...shortContact,
        plan: "yes",
        source: "no",
      },
      "ContactPersonGroup/Phone/required": {
        ...shortContact,
        plan: "yes",
        source: "no",
      },
      "ContactPersonGroup/Email/required": {
        ...shortContact,
        plan: "yes",
        source: "no",
      },
      "ContactPersonGroup/Email/minLength": { ...email, plan: null, source: 1 },
      "ApplicationCertification/enumType": {
        ...bool,
        plan: null,
        source: "YesNoDataType",
      },
      "AuthorizedRepresentativeEmail/minLength": {
        ...email,
        plan: null,
        source: 1,
      },
      "AuthorizedRepresentativeSignature/required": {
        ...draft,
        plan: "conditional",
        source: "yes",
      },
      "AuthorizedRepresentativeDateSigned/required": {
        ...draft,
        plan: "conditional",
        source: "yes",
      },
    },
  },
  jsonSchemaVsXsd: {
    differingRules: {
      "date_received/required": { ...draft, plan: "no", source: "yes" },
      "project_director.email/minLength": { ...email, plan: null, source: 1 },
      "same_as_project_director/enum": {
        ...bool,
        plan: null,
        source: ["Y: Yes", "N: No"],
      },
      "contact_person.email/minLength": { ...email, plan: null, source: 1 },
      "application_certification/enum": {
        ...bool,
        plan: null,
        source: ["Y: Yes", "N: No"],
      },
      "authorized_representative.email/minLength": {
        ...email,
        plan: null,
        source: 1,
      },
      "authorized_representative.signature/required": {
        ...draft,
        plan: "no",
        source: "yes",
      },
      "authorized_representative.date_signed/required": {
        ...draft,
        plan: "no",
        source: "yes",
      },
    },
  },
  xmlMappingVsJsonSchema: {
    absentFromPlan: {
      "applicant.applicant_type_code[]": wireSlots,
    },
  },
  xmlMappingVsXsd: {
    absentFromPlan: {
      ApplicantTypeCode1: wireSlots,
      ApplicantTypeCode2: wireSlots,
      ApplicantTypeCode3: wireSlots,
    },
  },
};
