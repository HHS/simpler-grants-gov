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
const mappedSlots = {
  category: "intentional",
  reason:
    "The plan lists the applicant types once, as one ordered list. The XML mapping writes each item to its numbered element.",
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
const agree = {
  category: "intentional",
  reason:
    "DAT 9-02 requires checking I Agree, so the shared certification accepts only true. The authored XML transform writes the affirmative Yes code.",
} as const;
const district = {
  category: "intentional",
  reason:
    "The XSD allows one to six characters with no pattern. The shared question requires DAT 5g-1's format: two state characters, a hyphen and a three-character district (CA-005, 00-000).",
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
      "CongressionalDistrictApplicant/minLength": {
        ...district,
        plan: 6,
        source: 1,
      },
      "CongressionalDistrictApplicant/pattern": {
        ...district,
        plan: "^[A-Z0-9]{2}-[A-Za-z0-9]{3}$",
        source: null,
      },
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
      "application.date_received/required": {
        ...draft,
        plan: "no",
        source: "yes",
      },
      "contacts.project_director.email/minLength": {
        ...email,
        plan: null,
        source: 1,
      },
      "contacts.point_of_contact.same_as_project_director/enum": {
        ...bool,
        plan: null,
        source: ["Y: Yes", "N: No"],
      },
      "contacts.point_of_contact.email/minLength": {
        ...email,
        plan: null,
        source: 1,
      },
      "certification.agree/enum": {
        ...agree,
        plan: ["true"],
        source: ["Y: Yes", "N: No"],
      },
      "contacts.authorized_representative.email/minLength": {
        ...email,
        plan: null,
        source: 1,
      },
      "certification.signature/required": {
        ...draft,
        plan: "no",
        source: "yes",
      },
      "certification.date_signed/required": {
        ...draft,
        plan: "no",
        source: "yes",
      },
    },
  },
  xmlMapping: {
    absentFromPlan: {
      "applicant.type.codes[] -> ApplicantTypeCode1": mappedSlots,
      "applicant.type.codes[] -> ApplicantTypeCode2": mappedSlots,
      "applicant.type.codes[] -> ApplicantTypeCode3": mappedSlots,
    },
  },
};
