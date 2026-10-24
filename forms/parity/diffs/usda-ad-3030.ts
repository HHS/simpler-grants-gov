import type { FormDiff } from "../harness/model.ts";
export const DIFF: FormDiff = {
  slug: "usda-ad-3030",
  dat: {
    differingLabels: {
      "1-05": {
        plan: "* 1. APPLICANT'S NAME",
        source: "1. APPLICANT'S NAME",
        category: "intentional",
        reason:
          "The library visibly marks source-required values; these DAT labels do not include an asterisk.",
      },
      "1-06": {
        plan: "* 2. APPLICANT'S ADDRESS (Including Zip Code)",
        source: "2. APPLICANT'S ADDRESS (Including Zip Code)",
        category: "intentional",
        reason:
          "The library visibly marks source-required values; these DAT labels do not include an asterisk.",
      },
      "1-07": {
        plan: "* 3. TAX ID NO. (Last 4 digits)",
        source: "3. TAX ID NO. (Last 4 digits)",
        category: "intentional",
        reason:
          "The library visibly marks source-required values; these DAT labels do not include an asterisk.",
      },
      "1-08": {
        plan: "* 4A. Has the Applicant been convicted of a felony criminal violation under any Federal law in the 24 months preceding the date of application?",
        source:
          "4A. Has the Applicant been convicted of a felony criminal violation under any Federal law in the 24 months preceding the date of application?",
        category: "intentional",
        reason:
          "The library visibly marks source-required values; these DAT labels do not include an asterisk.",
      },
      "1-09": {
        plan: "* 4B. Does the Applicant have any unpaid Federal tax liability that has been assessed, for which all judicial and administrative remedies have been exhausted or have lapsed, and that is not being paid in a timely manner pursuant to an agreement with the authority responsible for collecting the tax liability?",
        source:
          "4B. Does the Applicant have any unpaid Federal tax liability that has been assessed, for which all judicial and administrative remedies have been exhausted or have lapsed, and that is not being paid in a timely manner pursuant to an agreement with the authority responsible for collecting the tax liability?",
        category: "intentional",
        reason:
          "The library visibly marks source-required values; these DAT labels do not include an asterisk.",
      },
      "1-12": {
        plan: "* 5A. APPLICANT'S SIGNATURE (BY)",
        source: "5A. APPLICANT'S SIGNATURE (BY)",
        category: "intentional",
        reason:
          "The library visibly marks source-required values; these DAT labels do not include an asterisk.",
      },
      "1-13": {
        plan: "* 5B. TITLE/RELATIONSHIP OF THE INDIVIDUAL IF SIGNING IN A REPRESENTATIVE CAPACITY",
        source:
          "5B. TITLE/RELATIONSHIP OF THE INDIVIDUAL IF SIGNING IN A REPRESENTATIVE CAPACITY",
        category: "intentional",
        reason:
          "The library visibly marks source-required values; these DAT labels do not include an asterisk.",
      },
      "1-14": {
        plan: "* 5C. DATE SIGNED (MM-DD-YYYY)",
        source: "5C. DATE SIGNED (MM-DD-YYYY)",
        category: "intentional",
        reason:
          "The library visibly marks source-required values; these DAT labels do not include an asterisk.",
      },
    },
  },
  xsd: {
    differingRules: {
      "TaxIDNumber/pattern": {
        plan: "^[0-9]{4}$",
        source: null,
        category: "upstream",
        reason:
          "DAT1-07 explicitly requires four digits; the XSD only constrains string length. The candidate preserves the mechanical DAT rule and leading zeros without coercion.",
      },
    },
  },
};
