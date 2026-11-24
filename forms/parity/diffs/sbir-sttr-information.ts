import type { FormDiff, Recorded, Pinned } from "../harness/model.ts";
const radioChoice: Recorded = {
  category: "intentional",
  reason:
    "The DAT gives each radio choice its own row. The applicant chooses one value for the parent question.",
};
const yesNo: Pinned = {
  plan: null,
  source: ["Y: Yes", "N: No"],
  category: "intentional",
  reason:
    "The applicant selects Yes or No. XML writes the Grants.gov values Y: Yes and N: No.",
};
export const DIFF: FormDiff = {
  slug: "sbir-sttr-information",
  xml: "xml-mapping",
  dat: {
    absentFromPlan: {
      "A-2": radioChoice,
      "A-3": radioChoice,
      "A-4": radioChoice,
      "A-5": radioChoice,
      "C-2": radioChoice,
      "C-3": radioChoice,
      "C-4": radioChoice,
      "D-02": radioChoice,
      "D-03": radioChoice,
      "D-04": radioChoice,
      "D-05": radioChoice,
      "D-06": radioChoice,
      "D-07": radioChoice,
      "D-08": radioChoice,
      "D-09": radioChoice,
      "F-01-02": radioChoice,
      "F-01-03": radioChoice,
      "F-01-06": radioChoice,
      "F-01-07": radioChoice,
      "F-01-09": radioChoice,
      "F-01-10": radioChoice,
      "F-02-2": radioChoice,
      "F-02-3": radioChoice,
      "F-03-2": radioChoice,
      "F-03-3": radioChoice,
      "F-04-2": radioChoice,
      "F-04-3": radioChoice,
      "F-05-2": radioChoice,
      "F-05-3": radioChoice,
      "F-06-2": radioChoice,
      "F-06-3": radioChoice,
      "F-07-2": radioChoice,
      "F-07-3": radioChoice,
      "F-09-2": radioChoice,
      "F-09-3": radioChoice,
      "F-10-2": radioChoice,
      "F-10-3": radioChoice,
      "F-11-2": radioChoice,
      "F-11-3": radioChoice,
      "F-12-2": radioChoice,
      "F-12-3": radioChoice,
    },
    differingLabels: {
      "A-6": {
        plan: "Other Agency",
        source: null,
        category: "intentional",
        reason:
          "The DAT leaves the input unlabeled. The form names the agency that the applicant must enter.",
      },
      "B-1": {
        plan: "* SBC Control ID:",
        source: "* SBC Control ID",
        category: "intentional",
        reason: "The plan retains the punctuation beside the input.",
      },
      "D-11": {
        plan: "Phase I Letter of Intent Number:",
        source: "Phase I Letter of Intent Number",
        category: "intentional",
        reason: "The plan retains the punctuation beside the input.",
      },
      "E-1": {
        plan: "Agency Topic/Subtopic:",
        source: "* Agency Topic/Subtopic",
        category: "intentional",
        reason:
          "The plan retains the field wording and shows required markers according to the selected program or agency.",
      },
      "F-02-4": {
        plan: "If yes, insert the names of the Federal laboratories/agencies:",
        source:
          "* If yes, insert the names of the Federal laboratories/agencies",
        category: "intentional",
        reason:
          "The plan retains the field wording and shows required markers according to the selected program or agency.",
      },
      "F-03-1": {
        plan: "* 3. Are you located in a HUBZone?",
        source:
          "* 3. Are you located in a HUBZone? To find out if your business is in a HUBZone, use the mapping utility provided by the Small Business Administration at its web site: http://www.sba.gov",
        category: "intentional",
        reason: "The label asks the HUBZone question directly.",
      },
      "F-04-4": {
        plan: "Explanation for work outside the United States",
        source:
          "If no, provide an explanation in an attached file. * Explanation",
        category: "intentional",
        reason:
          "The label identifies the document required when some work takes place outside the United States.",
      },
      "F-05-4": {
        plan: "If yes, insert the names of the other Federal agencies:",
        source: "* If yes, insert the names of the other Federal agencies",
        category: "intentional",
        reason:
          "The plan retains the field wording and shows required markers according to the selected program or agency.",
      },
      "F-08-1": {
        plan: "8. Commercialization Plan",
        source:
          "* 8. Commercialization Plan: The following applications require a Commercialization Plan: Phase I (DOE only), Phase II (all agencies), Phase I/II Fast-Track (all agencies). Include a Commercialization Plan in accordance with the agency announcement and/or agency-specific instructions. * Attach File",
        category: "intentional",
        reason:
          "The document name is the label. The help text explains which agencies and phases require it.",
      },
      "F-09-1": {
        plan: "9. Have you received SBIR Phase II awards from the Federal Government? If yes, provide a company commercialization history in accordance with agency-specific instructions using this attachment.",
        source:
          "* 9. Have you received SBIR Phase II awards from the Federal Government? If yes, provide a company commercialization history in accordance with agency-specific instructions using this attachment.",
        category: "intentional",
        reason:
          "The plan retains the field wording and shows required markers according to the selected program or agency.",
      },
      "F-09-4": {
        plan: "SBIR commercialization history",
        source: "* Attach File",
        category: "intentional",
        reason: "The label identifies the commercialization history document.",
      },
      "F-10-1": {
        plan: "10. Will the Project Director/Principal Investigator have his/her primary employment with the small business at the time of award?",
        source:
          "* 10. Will the Project Director/Principal Investigator have his/her primary employment with the small business at the time of award?",
        category: "intentional",
        reason:
          "The plan retains the field wording and shows required markers according to the selected program or agency.",
      },
      "F-11-1": {
        plan: "11. Please indicate whether the answer to BOTH of the following questions is TRUE: (1) Does the Project Director/Principal Investigator have a formal appointment or commitment either with the small business directly (as an employee or a contractor) OR as an employee of the Research Institution, which in turn has made a commitment to the small business through the STTR application process; AND (2) Will the Project Director/Principal Investigator devote at least 10% effort to the proposed project?",
        source:
          "* 11. Please indicate whether the answer to BOTH of the following questions is TRUE: (1) Does the Project Director/Principal Investigator have a formal appointment or commitment either with the small business directly (as an employee or a contractor) OR as an employee of the Research Institution, which in turn has made a commitment to the small business through the STTR application process; AND (2) Will the Project Director/Principal Investigator devote at least 10% effort to the proposed project?",
        category: "intentional",
        reason:
          "The plan retains the field wording and shows required markers according to the selected program or agency.",
      },
      "F-12-1": {
        plan: "12. In the joint research and development proposed in this project, does the small business perform at least 40% of the work and the research institution named in the application perform at least 30% of the work?",
        source:
          "* 12. In the joint research and development proposed in this project, does the small business perform at least 40% of the work and the research institution named in the application perform at least 30% of the work?",
        category: "intentional",
        reason:
          "The plan retains the field wording and shows required markers according to the selected program or agency.",
      },
      "F-13": {
        plan: "13. Provide UEI of non-profit research partner for STTR.",
        source: "* 13. Provide UEI of non-profit research partner for STTR.",
        category: "intentional",
        reason:
          "The plan retains the field wording and shows required markers according to the selected program or agency.",
      },
    },
    differingRules: {
      "F-01-04/maxLength": {
        plan: null,
        source: 999,
        category: "intentional",
        reason:
          "The DAT puts 999 in the length column for an integer. The valid employee count is 1 through 999.",
      },
    },
  },
  xsd: {
    differingRules: {
      "SBCControlID/pattern": {
        plan: "^[0-9]{9}$",
        source: null,
        category: "intentional",
        reason:
          "DAT B-1 requires exactly nine digits. The XSD enforces the length only.",
      },
    },
  },
  jsonSchemaVsXsd: {
    differingRules: {
      "eligibility_certification/enum": yesNo,
      "majority_venture_capital_owned/enum": yesNo,
      "faculty_or_student_owned/enum": yesNo,
      "federal_subcontracts_included/enum": yesNo,
      "hub_zone_located/enum": yesNo,
      "research_entirely_in_united_states/enum": yesNo,
      "equivalent_federal_work/enum": yesNo,
      "disclosure_permitted/enum": yesNo,
      "taba_funds_requested/enum": yesNo,
      "phase_ii_awards_received/enum": yesNo,
      "principal_investigator_primary_employment/enum": yesNo,
      "appointment_and_minimum_effort_certified/enum": yesNo,
      "small_business_and_institution_work_shares_certified/enum": yesNo,
    },
  },
};
