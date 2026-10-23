import type { FormDiff, Pinned, Recorded } from "../harness/model.ts";

/** Literal per-field pins; source or plan edits invalidate the corresponding entry. */

export const DIFF: FormDiff = {
  slug: "sf424-r-r",
  dat: {
    differingLabels: {
      "01-0": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 01-0: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "* Type of Submission",
        source: "1. TYPE OF SUBMISSION",
      },
      "02-0": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 02-0: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "Date Submitted",
        source: "2. DATE SUBMITTED",
      },
      "03-0": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 03-0: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "Date Received by State",
        source: "3. DATE RECEIVED BY STATE",
      },
      "04-0": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 04-0: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "Federal Identifier",
        source: "4. a. Federal Identifier",
      },
      "04-1": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 04-1: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "Agency Routing Identifier",
        source: "b. Agency Routing Identifier",
      },
      "04-2": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 04-2: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "Previous Grants.gov Tracking ID",
        source: "c. Previous Grants.gov Tracking ID",
      },
      "05-1": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 05-1: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* UEI",
        source: "UEI",
      },
      "05-2": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 05-2: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Legal Name",
        source: "Legal Name",
      },
      "05-5a": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 05-5a: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Street1",
        source: "Street1",
      },
      "05-5c": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 05-5c: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* City",
        source: "City",
      },
      "05-5d": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 05-5d: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "County",
        source: "County / Parish",
      },
      "05-5f": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 05-5f: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Country",
        source: "Country",
      },
      "05-6b": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 05-6b: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* First Name",
        source: "First Name",
      },
      "05-6d": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 05-6d: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Last Name",
        source: "Last Name",
      },
      "05-6g": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 05-6g: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Street1",
        source: "Street1",
      },
      "05-6i": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 05-6i: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* City",
        source: "City",
      },
      "05-6j": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 05-6j: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "County",
        source: "County / Parish",
      },
      "05-6m": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 05-6m: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Country",
        source: "Country",
      },
      "05-7": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 05-7: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Phone Number",
        source: "Phone Number",
      },
      "06-0": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 06-0: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "* Employer Identification Number",
        source: "6. EMPLOYER IDENTIFICATION (EIN) or (TIN)",
      },
      "07-0": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 07-0: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "* Applicant Type Code",
        source: "7. TYPE OF APPLICANT",
      },
      "08-0": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 08-0: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "* Application Type Code",
        source: "8. TYPE OF APPLICATION",
      },
      "08-1-1": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "Revision Reasons",
        source: "A. Increase Award",
      },
      "08-1-2": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "Revision Reasons",
        source: "B. Decrease Award",
      },
      "08-1-3": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "Revision Reasons",
        source: "C. Increase Duration",
      },
      "08-1-4": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "Revision Reasons",
        source: "D. Decrease Duration",
      },
      "08-1-5": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "Revision Reasons",
        source: "E. Other",
      },
      "08-1-6": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 08-1-6: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "Revision Other Explanation",
        source: "(specify)",
      },
      "08-2": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 08-2: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "* Is This Application Being Submitted to Other Agencies?",
        source: "Is this application being submitted to other agencies?",
      },

      "09-0": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 09-0: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "* Federal Agency Name",
        source: "9. NAME OF FEDERAL AGENCY",
      },
      "10-1": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 10-1: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "Assistance Listing Number",
        source: "10. ASSISTANCE LISTING NUMBER",
      },

      "11-0": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 11-0: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "* Project Title",
        source: "11. DESCRIPTIVE TITLE OF APPLICANT'S PROJECT",
      },
      "12-1": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 12-1: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Start Date",
        source: "Start Date",
      },
      "12-2": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 12-2: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "* End Date",
        source: "Ending Date",
      },
      "13-1": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 13-1: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "* Congressional District",
        source: null,
      },
      "14-02": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 14-02: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* First Name",
        source: "First Name",
      },
      "14-04": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 14-04: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Last Name",
        source: "Last Name",
      },
      "14-07": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 14-07: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Organization Name",
        source: "Organization Name",
      },
      "14-10a": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 14-10a: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Street1",
        source: "Street1",
      },
      "14-10c": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 14-10c: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* City",
        source: "City",
      },
      "14-10d": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 14-10d: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "County",
        source: "County / Parish",
      },
      "14-10f": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 14-10f: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Country",
        source: "Country",
      },
      "14-11": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 14-11: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Phone Number",
        source: "Phone Number",
      },
      "14-13": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 14-13: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "* Email Address",
        source: "Email",
      },
      "15-1": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 15-1: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "* Total Federal Funds Requested",
        source: "a. Total Federal Funds Requested",
      },
      "15-2": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 15-2: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "* Total Non-Federal Funds",
        source: "b. Total Non-Federal Funds",
      },
      "15-3": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 15-3: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "* Total Federal & Non-Federal Funds",
        source: "c. Total Federal & Non-Federal Funds",
      },
      "15-4": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 15-4: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "* Estimated Program Income",
        source: "d. Estimated Program Income",
      },
      "16-0": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 16-0: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "* State Review Code",
        source:
          "16. IS APPLICATION SUBJECT TO REVIEW BY STATE EXECUTIVE ORDER 12372 PROCESS?",
      },
      "16-3": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 16-3: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "State Review Date",
        source: "DATE",
      },
      "17-1": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 17-1: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "* I Agree",
        source: "I agree",
      },
      "18-0": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 18-0: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "SFLLL or Other Explanatory Documentation",
        source:
          "18. SFLLL (Disclosure of Lobbying Activities) or other Explanatory Documentation",
      },
      "19-02": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 19-02: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* First Name",
        source: "First Name",
      },
      "19-04": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 19-04: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Last Name",
        source: "Last Name",
      },
      "19-06": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 19-06: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Position/Title",
        source: "Position/Title",
      },
      "19-07": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 19-07: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Organization",
        source: "Organization",
      },
      "19-10a": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 19-10a: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Street1",
        source: "Street1",
      },
      "19-10c": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 19-10c: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* City",
        source: "City",
      },
      "19-10d": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 19-10d: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "County",
        source: "County / Parish",
      },
      "19-10f": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 19-10f: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Country",
        source: "Country",
      },
      "19-11": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 19-11: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Phone Number",
        source: "Phone Number",
      },
      "19-13": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 19-13: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Email",
        source: "Email",
      },
      "19-14": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 19-14: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Signature of Authorized Representative",
        source: "Signature of Authorized Representative",
      },
      "19-15": {
        category: "upstream",
        reason:
          "DAT FID768 v5.0 19-15: Required? says Yes but the source label omits the asterisk added by the maintained comparison.",
        plan: "* Date Signed",
        source: "Date Signed",
      },
      "20-0": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 20-0: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "Pre-application",
        source: "20. Pre-application",
      },
      "21-0": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0 21-0: proposed field/group context replaces the PDF-dependent label. Individual choice controls retain their source meaning through the explicit choice-to-code binding.",
        plan: "Cover Letter",
        source: "21. Cover Letter Attachment",
      },
    },
    differingHelp: {
      "08-1-1": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0: one revision-answer instruction states all five choice labels, admitted combinations, activation and Other explanation; this source row describes only its individual checkbox.",
        plan: "Select A (Increase Award), B (Decrease Award), C (Increase Duration), D (Decrease Duration), or E (Other). The XSD permits A, B, C, D, E, AC, AD, BC and BD. Enable only for Revision; require an explanation for E.",
        source: "A. Increase Award May select more than one.",
      },
      "08-1-2": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0: one revision-answer instruction states all five choice labels, admitted combinations, activation and Other explanation; this source row describes only its individual checkbox.",
        plan: "Select A (Increase Award), B (Decrease Award), C (Increase Duration), D (Decrease Duration), or E (Other). The XSD permits A, B, C, D, E, AC, AD, BC and BD. Enable only for Revision; require an explanation for E.",
        source: "B. Decrease Award May select more than one.",
      },
      "08-1-3": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0: one revision-answer instruction states all five choice labels, admitted combinations, activation and Other explanation; this source row describes only its individual checkbox.",
        plan: "Select A (Increase Award), B (Decrease Award), C (Increase Duration), D (Decrease Duration), or E (Other). The XSD permits A, B, C, D, E, AC, AD, BC and BD. Enable only for Revision; require an explanation for E.",
        source: "C. Increase Duration May select more than one.",
      },
      "08-1-4": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0: one revision-answer instruction states all five choice labels, admitted combinations, activation and Other explanation; this source row describes only its individual checkbox.",
        plan: "Select A (Increase Award), B (Decrease Award), C (Increase Duration), D (Decrease Duration), or E (Other). The XSD permits A, B, C, D, E, AC, AD, BC and BD. Enable only for Revision; require an explanation for E.",
        source: "D. Decrease Duration May select more than one.",
      },
      "08-1-5": {
        category: "intentional",
        reason:
          "DAT FID768 v5.0: one revision-answer instruction states all five choice labels, admitted combinations, activation and Other explanation; this source row describes only its individual checkbox.",
        plan: "Select A (Increase Award), B (Decrease Award), C (Increase Duration), D (Decrease Duration), or E (Other). The XSD permits A, B, C, D, E, AC, AD, BC and BD. Enable only for Revision; require an explanation for E.",
        source:
          'E. Other If "Other" is selected, please specify in text box provided.',
      },
    },
  },
  xsd: {
    absentFromPlan: {
      "ApplicantInfo/OrganizationInfo/EIN": {
        category: "upstream",
        reason:
          "The imported optional OrganizationDataTypeV5 EIN has no separate DAT/PDF question. DAT06-0 maps to root EmployerID. Proposed disposition: do not collect a second EIN or emit this unused optional element. Review this source discrepancy before implementation.",
      },
    },
  },
};
