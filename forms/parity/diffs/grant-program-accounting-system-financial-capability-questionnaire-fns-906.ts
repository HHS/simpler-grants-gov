import type { FormDiff } from "../harness/model.ts";

// Tuples are [source coordinate, proposed value, original source value].
// Every value remains pinned; source/plan changes still invalidate the record.
export const DIFF: FormDiff = {
  slug: "grant-program-accounting-system-financial-capability-questionnaire-fns-906",
  dat: {
    differingLabels: {
      ...Object.fromEntries(
        (
          [
            ["2-2", "* Legal Organization Name:", "Legal Organization Name"],
            ["2-3", "* UEI Number:", "UEI Number"],
            [
              "3-1-1",
              "* 1. Has your organization received a Federal award within the past 3 years?",
              "1. Has your organization received a Federal award within the past 3 years?",
            ],
            [
              "3-2-1",
              "* 2. Does your organization utilize accounting software to manage your financial records?",
              "2. Does your organization utilize accounting software to manage your financial records?",
            ],
            [
              "3-3-1",
              "* 3. Does your accounting system identify the receipt and expenditure of program funds separately for each grant?",
              "3. Does your accounting system identify the receipt and expenditure of program funds separately for each grant?",
            ],
            [
              "3-4-1",
              "* 4. Does your organization have a dedicated individual responsible for monitoring organizational funds, such as an accountant or a finance manager?",
              "4. Does your organization have a dedicated individual responsible for monitoring organizational funds, such as an accountant or a finance manager?",
            ],
            [
              "3-5-1",
              "* 5. Does your organization separate the duties for staff handling the approval of transactions and the recording and payment of funds?",
              "5. Does your organization separate the duties for staff handling the approval of transactions and the recording and payment of funds?",
            ],
            [
              "3-6-1",
              "* 6. Does your organization have the ability to specifically identify and allocate employee effort to an applicable program?",
              "6. Does your organization have the ability to specifically identify and allocate employee effort to an applicable program?",
            ],
            [
              "3-7-1",
              "* 7. Does your organization have a property/inventory management system in place to track location and value of equipment purchased under the award?",
              "7. Does your organization have a property/inventory management system in place to track location and value of equipment purchased under the award?",
            ],
            [
              "4-1-1",
              "* 1. Has your organization been audited within the last 5 fiscal years? (If the answer is “Yes” and this report was issued under the Single Audit Act please note this in the box below marked “Additional Information” and if not issued under the “Single Audit Act”, please provide a link to the audit report in the Hyperlink space below, or attach a copy to your application’s ATTACHMENTS FORM).",
              "1. Has your organization been audited within the last 5 fiscal years? (If the answer is “Yes” and this report was issued under the Single Audit Act please note this in the box below marked “Additional Information” and if not issued under the “Single Audit Act”, please provide a link to the audit report in the Hyperlink space below, or attach a copy to your application’s ATTACHMENTS FORM).",
            ],
            ["5-0", "Hyperlink (if available):", "Hyperlink (if available)"],
            [
              "6-0",
              "Additional information including expanding on responses in previous sections:",
              "Additional information including expanding on responses in previous sections",
            ],
            [
              "7-2-1",
              "* Authorized Representative's Signature:",
              "Authorized Representative's Signature",
            ],
            ["7-2-2", "* Date:", "Date"],
            ["7-4", "* Phone:", "Phone"],
            ["7-5", "* Email:", "Email"],
          ] as const
        ).map(([key, plan, source]) => [
          key,
          {
            category: "intentional" as const,
            reason:
              "Required markers, punctuation or whitespace differ in presentation only. The source field, meaning, requiredness and value remain unchanged.",
            plan,
            source,
          },
        ]),
      ),
      ...Object.fromEntries(
        (
          [
            ["7-3-2", "* First Name", "First"],
            ["7-3-3", "Middle Name", "Middle"],
            ["7-3-4", "* Last Name", "Last"],
          ] as const
        ).map(([key, plan, source]) => [
          key,
          {
            category: "intentional" as const,
            reason:
              "Reuse the established name/address part label under the explicit source role/section, or render the source-required marker. Every original source coordinate and source-specific instruction is retained; no ownership or validation change follows from the label.",
            plan,
            source,
          },
        ]),
      ),
    },
    differingHelp: {
      ...Object.fromEntries(
        (
          [
            ["7-3-1", "Enter the prefix.", "Pre-populated from the SF-424."],
            [
              "7-3-2",
              "Enter the first name.",
              "Pre-populated from the SF-424.",
            ],
            [
              "7-3-3",
              "Enter the middle name.",
              "Pre-populated from the SF-424.",
            ],
            ["7-3-4", "Enter the last name.", "Pre-populated from the SF-424."],
            ["7-3-5", "Enter the suffix.", "Pre-populated from the SF-424."],
          ] as const
        ).map(([key, plan, source]) => [
          key,
          {
            category: "intentional" as const,
            reason:
              "Reuse established question/part help. The role heading, readonly schema/controls and plan pre_populated values retain exact source ownership; original source-specific instructions remain available in the pinned DAT and plan context. No new signing or automatic population behavior is implied.",
            plan,
            source,
          },
        ]),
      ),
    },
  },
  xsd: {
    differingRules: {
      ...Object.fromEntries(
        ([["Email/minLength", null, 1]] as const).map(([key, plan, source]) => [
          key,
          {
            category: "intentional" as const,
            reason:
              "The existing shared email question uses format email, which already rejects an empty string, rather than a redundant minLength error. MaxLength60 and source invalid-email instructions are preserved and tested with actual invalid/empty email cases.",
            plan,
            source,
          },
        ]),
      ),
    },
  },
  jsonSchemaVsXsd: {
    differingRules: {
      ...Object.fromEntries(
        ([["email/minLength", null, 1]] as const).map(([key, plan, source]) => [
          key,
          {
            category: "intentional" as const,
            reason:
              "The existing shared email question uses format email, which already rejects an empty string, rather than a redundant minLength error. MaxLength60 and source invalid-email instructions are preserved and tested with actual invalid/empty email cases.",
            plan,
            source,
          },
        ]),
      ),
    },
  },
};
