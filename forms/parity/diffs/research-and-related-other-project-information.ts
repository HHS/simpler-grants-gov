import type { FormDiff, Pinned, Recorded } from "../harness/model.ts";
import { RADIO_OPTIONS, YES_NO_BOOLEAN } from "./common.ts";

const yesNo: Pinned = {
  ...YES_NO_BOOLEAN,
  plan: null,
  source: ["Y: Yes", "N: No"],
};

const exemption: Recorded = {
  category: "intentional",
  reason:
    "Each checkbox is a choice in the exemption list. Selected codes are written as separate ExemptionNumber elements.",
};
export const DIFF: FormDiff = {
  slug: "research-and-related-other-project-information",
  xml: "xml-mapping",
  dat: {
    differingLabels: {
      "01-0": {
        category: "intentional",
        plan: "* 1. Are Human Subjects Involved?",
        source: "1. Are Human Subjects Involved?",
        reason:
          "Observed source DAT marks this field required in D but does not print an asterisk in B. The parity presentation adds its required marker to the plan label. Field text and requiredness are unchanged; this is assessed formatting, not human acceptance.",
      },
      "01-a-3": {
        category: "intentional",
        plan: "IRB Approval Date:",
        source: "IRB Approval Date",
        reason: "The form keeps the punctuation printed beside the question.",
      },
      "01-a-4": {
        category: "intentional",
        plan: "Human Subject Assurance Number:",
        source: "Human Subject Assurance Number",
        reason: "The form keeps the punctuation printed beside the question.",
      },
      "02-0": {
        category: "intentional",
        plan: "* 2. Are Vertebrate Animals Used?",
        source: "2. Are Vertebrate Animals Used?",
        reason:
          "Observed source DAT marks this field required in D but does not print an asterisk in B. The parity presentation adds its required marker to the plan label. Field text and requiredness are unchanged; this is assessed formatting, not human acceptance.",
      },
      "02-a-3": {
        category: "intentional",
        plan: "IACUC Approval Date:",
        source: "IACUC Approval Date",
        reason: "The form keeps the punctuation printed beside the question.",
      },
      "02-a-4": {
        category: "intentional",
        plan: "Animal Welfare Assurance Number:",
        source: "Animal Welfare Assurance Number",
        reason: "The form keeps the punctuation printed beside the question.",
      },
      "03-0": {
        category: "intentional",
        plan: "* 3. Is proprietary/privileged information included in the application?",
        source:
          "3. Is proprietary/privileged information included in the application?",
        reason:
          "Observed source DAT marks this field required in D but does not print an asterisk in B. The parity presentation adds its required marker to the plan label. Field text and requiredness are unchanged; this is assessed formatting, not human acceptance.",
      },
      "04-a": {
        category: "intentional",
        plan: "* 4.a. Does this Project Have an Actual or Potential Impact - positive or negative - on the environment?",
        source:
          "4.a. Does this Project Have an Actual or Potential Impact - positive or negative - on the environment?",
        reason:
          "Observed source DAT marks this field required in D but does not print an asterisk in B. The parity presentation adds its required marker to the plan label. Field text and requiredness are unchanged; this is assessed formatting, not human acceptance.",
      },
      "04-b": {
        category: "intentional",
        plan: "4.b. If yes, please explain:",
        source: "4.b. If yes, please explain",
        reason: "The form keeps the punctuation printed beside the question.",
      },
      "04-d": {
        category: "intentional",
        plan: "4.d. If yes, please explain:",
        source: "4.d. If yes, please explain",
        reason: "The form keeps the punctuation printed beside the question.",
      },
      "05-0": {
        category: "intentional",
        plan: "* 5. Is the research performance site designated, or eligible to be designated, as a historic place?",
        source:
          "5. Is the research performance site designated, or eligible to be designated, as a historic place?",
        reason:
          "Observed source DAT marks this field required in D but does not print an asterisk in B. The parity presentation adds its required marker to the plan label. Field text and requiredness are unchanged; this is assessed formatting, not human acceptance.",
      },
      "05-a": {
        category: "intentional",
        plan: "5.a. If yes, please explain:",
        source: "5.a. If yes, please explain",
        reason: "The form keeps the punctuation printed beside the question.",
      },
      "06-0": {
        category: "intentional",
        plan: "* 6. Does this project involve activities outside of the United States or partnerships with international collaborators?",
        source:
          "6. Does this project involve activities outside of the United States or partnerships with international collaborators?",
        reason:
          "Observed source DAT marks this field required in D but does not print an asterisk in B. The parity presentation adds its required marker to the plan label. Field text and requiredness are unchanged; this is assessed formatting, not human acceptance.",
      },
      "06-a": {
        category: "intentional",
        plan: "6.a. If yes, identify countries:",
        source: "6.a. If yes, identify countries",
        reason: "The form keeps the punctuation printed beside the question.",
      },
      "06-b": {
        category: "intentional",
        plan: "6.b. Optional Explanation:",
        source: "6.b. Optional Explanation",
        reason: "The form keeps the punctuation printed beside the question.",
      },
    },
    differingHelp: {
      "01-0": {
        category: "intentional",
        plan: "If activities involving human subjects are planned at any time during the proposed project at any performance site, check yes. Check yes, even if the proposed project is exempt from Regulations for the Protection of Human Subjects. If no, skip the rest of block 1. This field is required. If activities involving human subjects are not planned at any time during the proposed project at any performance site, click here for no. Skip the rest of block 1. This field is required.",
        source: null,
        reason:
          "The radio question shows one set of instructions for both answers.",
      },
      "01-a-1": {
        category: "intentional",
        plan: "Is the Project Exempt from Federal regulations is required. Yes, this project is exempt from Federal regulations. No, this project is not exempt from Federal regulations.",
        source: "Is the Project Exempt from Federal regulations is required.",
        reason:
          "Observed displayed help preserves parent Q10 and option Q11/Q12. Source option tips are aggregated onto their single enum control where applicable; the exact original Q text is retained, with source-review ambiguity explained visibly rather than silently rewritten. This records the actual compared strings and does not accept source policy, waive validation or claim runtime behavior.",
      },
      "01-a-2a": {
        category: "intentional",
        plan: "If IRB review is pending, check Yes. If IRB review is not pending, check No.",
        source: null,
        reason:
          "The radio question shows one set of instructions for both answers.",
      },
      "01-a-3": {
        category: "upstream",
        plan: "Enter the latest IRB approval date. Leave this blank if review is pending.",
        source:
          "Enter the latest Institutional Review Board (IRB) approval date (if available). Leave blank if Pending.",
        reason:
          "The DAT rule requires an approval date when review is complete. The instructions reflect that rule.",
      },
      "02-0": {
        category: "intentional",
        plan: "If activities involving vertebrate animals are planned at any time during the proposed project at any performance site, check yes. If no, skip the rest of block 2. This field is required.",
        source: null,
        reason:
          "The radio question shows one set of instructions for both answers.",
      },
      "02-a-2a": {
        category: "intentional",
        plan: "Indicate if an Institutional Animal Care and Use Committee (IACUC) review is pending. Indicate if an Institutional Animal Care and Use Committee (IACUC) review is pending. Click here if No.",
        source: null,
        reason:
          "The radio question shows one set of instructions for both answers.",
      },
      "02-a-3": {
        category: "upstream",
        plan: "Enter the latest IACUC approval date. Leave this blank if review is pending.",
        source:
          "Enter the latest Institutional Review Board (IRB) approval date (if available). Leave blank if Pending.",
        reason:
          "The DAT help names the IRB in the animal oversight section. This field records the IACUC approval date.",
      },
      "02-a-4": {
        category: "upstream",
        plan: "Enter the federally approved animal welfare assurance number.",
        source: "Enter the Federally approved assurance number, if available.",
        reason:
          "The DAT requires an assurance number when IACUC review is complete. Its help describes the number as optional.",
      },
      "03-0": {
        category: "intentional",
        plan: 'Patentable ideas, trade secrets, privileged or confidential commercial or financial information, disclosure of which may harm the applicant, should be included in applications only when such information is necessary to convey an understanding of the proposed project. If the application includes such information, check yes and clearly mark each line or paragraph on the pages containing the proprietary/privileged information with a legend similar to: "The following contains proprietary/privileged information that (name of applicant) requests not be released to persons outside the Government, except for purposes of review and evaluation." This field is required.',
        source: null,
        reason:
          "The radio question shows one set of instructions for both answers.",
      },
      "04-a": {
        category: "intentional",
        plan: "Indicate if this project has an actual or potential impact - positive or negative - on the environment. This field is required. Indicate if this project has an actual or potential impact - positive or negative - on the environment. Click no here if this is not the case. This field is required.",
        source: null,
        reason:
          "The radio question shows one set of instructions for both answers.",
      },
      "04-c": {
        category: "intentional",
        plan: "Check yes or no.",
        source: null,
        reason:
          "The radio question shows one set of instructions for both answers.",
      },
      "05-0": {
        category: "intentional",
        plan: "If any research performance site is designated or eligible to be designated as a historic place, if Yes, check the Yes box and then provide an explanation in the box provided in 5.a. Otherwise, check the No box. This field is required.",
        source: null,
        reason:
          "The radio question shows one set of instructions for both answers.",
      },
      "06-0": {
        category: "intentional",
        plan: "Indicate whether this project involves activities outside of the United States or partnerships with international collaborators. This field is required. Indicate whether this project involves activities outside of the United States or partnerships with international collaborators. Click here for no. This field is required.",
        source: null,
        reason:
          "The radio question shows one set of instructions for both answers.",
      },
      "12-0": {
        category: "intentional",
        plan: "Attach a file to provide any other project information not provided above or in accordance with the announcement and/or agency-specific instruction. Optional Other Attachment Check Box. Indicates whether an Optional Other Attachment is attached.",
        source:
          "Attach a file to provide any other project information not provided above or in accordance with the announcement and/or agency-specific instruction.",
        reason:
          "The upload instructions include the source’s file-presence indicator.",
      },
    },
    absentFromPlan: {
      "01-0a": RADIO_OPTIONS,
      "01-0b": RADIO_OPTIONS,
      "01-a-1a": RADIO_OPTIONS,
      "01-a-1b": RADIO_OPTIONS,
      "01-a-1d": exemption,
      "01-a-1e": exemption,
      "01-a-1f": exemption,
      "01-a-1g": exemption,
      "01-a-1h": exemption,
      "01-a-1i": exemption,
      "01-a-1j": exemption,
      "01-a-1k": exemption,
      "01-a-2b": RADIO_OPTIONS,
      "01-a-2c": RADIO_OPTIONS,
      "02-0a": RADIO_OPTIONS,
      "02-0b": RADIO_OPTIONS,
      "02-a-2b": RADIO_OPTIONS,
      "02-a-2c": RADIO_OPTIONS,
      "03-0a": RADIO_OPTIONS,
      "03-0b": RADIO_OPTIONS,
      "04-a-1": RADIO_OPTIONS,
      "04-a-2": RADIO_OPTIONS,
      "04-c-1": RADIO_OPTIONS,
      "04-c-2": RADIO_OPTIONS,
      "05-0a": RADIO_OPTIONS,
      "05-0b": RADIO_OPTIONS,
      "06-0a": RADIO_OPTIONS,
      "06-0b": RADIO_OPTIONS,
      "12-1": {
        category: "intentional",
        reason:
          "DAT 12-1 displays whether a file is attached. The file list supplies that information.",
      },
    },
    differingRules: {
      "12-0/maxOccurs": {
        category: "upstream",
        plan: 100,
        source: 1,
        reason:
          "Observed DAT F61 counts one Multi_file control, while I61 names AttachmentGroupMin0Max100DataType. The plan addresses the repeated file leaf and applies the DAT type cap100. All source file answers remain ordered in one otherAttachments array; one upload control does not mean one file. Raw RR XSD OtherAttachment is unbounded and is separately value-pinned below. This is assessed source-layer cardinality, not an invented default, waiver or accepted policy.",
      },
    },
  },
  xsd: {
    differingRules: {
      "OtherAttachments/OtherAttachment/maxOccurs": {
        category: "upstream",
        plan: 100,
        source: "unbounded",
        reason:
          "The DAT limits this list to 100 files. The XSD permits an unbounded list.",
      },
    },
  },
  jsonSchemaVsXsd: {
    differingRules: {
      "human_subjects.involved/enum": yesNo,
      "human_subjects.exempt_from_federal_regulations/enum": yesNo,
      "human_subjects.irb_review_pending/enum": yesNo,
      "vertebrate_animals.used/enum": yesNo,
      "vertebrate_animals.iacuc_review_pending/enum": yesNo,
      "proprietary_information_included/enum": yesNo,
      "environmental_impact.has_impact/enum": yesNo,
      "environmental_impact.assessment_or_exemption_performed/enum": yesNo,
      "historic_place.designated_or_eligible/enum": yesNo,
      "international_activities.involved/enum": yesNo,
    },
  },
};
