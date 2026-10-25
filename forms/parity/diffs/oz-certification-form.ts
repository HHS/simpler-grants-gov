import type { FormDiff } from "../harness/model.ts";

// Tuples are [source coordinate, proposed value, original source value].
// Every value remains pinned; source/plan changes still invalidate the record.
export const DIFF: FormDiff = {
  slug: "oz-certification-form",
  dat: {
    differingLabels: {
      ...Object.fromEntries(
        (
          [
            ["1-2", "* Applicant Organization:", "Applicant Organization"],
            [
              "3-0",
              "* The application meets which of the following criteria (please select one):",
              "The application meets which of the following criteria (please select one)",
            ],
            ["7-1-2", "* First Name", "First Name"],
            ["7-1-4", "* Last Name", "Last Name"],
            ["7-2", "* Title:", "Title"],
            ["7-3", "* Organization:", "Organization"],
            ["7-4", "* Signature:", "Signature"],
            ["7-5", "* Date:", "Date"],
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
            [
              "2-0",
              "* Opportunity Zone census tracts",
              "Opportunity Zone Census Tract(s), which the proposed activities/projects will benefit: Include below the full 11-digit census tract number (example: 06067001101). Designated Opportunity Zone Census Tracts can be found at: https://opportunityzones.hud.gov/resources. Select the “CDFI Fund Opportunity Zones Resources” link and then select the “List of designated Qualified Opportunity Zones.”",
            ],
            ["4-2", "* Estimated Funding Allocations", null],
            ["5-2", "Project support for Opportunity Zones", null],
            ["7-1-3", "Middle Name", "Middle"],
          ] as const
        ).map(([key, plan, source]) => [
          key,
          {
            category: "intentional" as const,
            reason:
              "Use a short readable label for the same source answer or shared name part. The complete source question, instructions and choice meanings remain in the help/section context; no field, option, limit or source obligation is removed.",
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
            [
              "2-0",
              "Opportunity Zone Census Tract(s), which the proposed activities/projects will benefit: Include below the full 11-digit census tract number (example: 06067001101). Designated Opportunity Zone Census Tracts can be found at: https://opportunityzones.hud.gov/resources. Select the “CDFI Fund Opportunity Zones Resources” link and then select the “List of designated Qualified Opportunity Zones.” Enter the Opportunity Zone Census Tract(s) which the proposed activities/projects will benefit. This field is required.",
              "Enter the Opportunity Zone Census Tract(s) which the proposed activities/projects will benefit. This field is required.",
            ],
            [
              "3-0",
              "The application meets which of the following criteria (please select one). One selection is required. Solely within — The proposed activities/projects will occur solely within the Opportunity Zone Census Tract(s) listed above. Within and other communities — The proposed activities/projects will occur within the Opportunity Zone Census Tract(s) listed above and other communities. Outside — The proposed activities/projects will occur outside Opportunity Zone Census Tracts, but substantial and direct benefits will accrue within the Opportunity Zone Census Tracts listed above.",
              "The application meets which of the following criteria (please select one). One selection is required.",
            ],
            [
              "5-2",
              "Provide a narrative explaining and/or reference the section in the application that explains how the project will support public and private investment in urban and economically distressed areas, specifically qualified Opportunity Zones (300-word limit): Example: “The Main Street project described in this application will stimulate economic opportunity and mobility, encourage entrepreneurship, expand quality educational opportunities, and promote workforce development for those families residing within the XYZ Opportunity Zone.” Provide a narrative explaining and/or reference the section in the application that explains how the project will support public and private investment in urban and economically distressed areas, specifically qualified Opportunity Zones (300-word limit).",
              "Provide a narrative explaining and/or reference the section in the application that explains how the project will support public and private investment in urban and economically distressed areas, specifically qualified Opportunity Zones (300-word limit).",
            ],
          ] as const
        ).map(([key, plan, source]) => [
          key,
          {
            category: "intentional" as const,
            reason:
              "Expose the complete original source choice meanings/instructions alongside the existing coded answer or a shorter field label. This is source wording relocation/addition for legibility; it does not invent a value, lookup, classification or calculation.",
            plan,
            source,
          },
        ]),
      ),
      ...Object.fromEntries(
        (
          [
            ["7-1-1", "Enter the prefix.", "Pre-populated from the SF-424."],
            [
              "7-1-2",
              "Enter the first name.",
              "Pre-populated from the SF-424. This field is required.",
            ],
            [
              "7-1-3",
              "Enter the middle name.",
              "Pre-populated from the SF-424.",
            ],
            [
              "7-1-4",
              "Enter the last name.",
              "Pre-populated from the SF-424. This field is required.",
            ],
            ["7-1-5", "Enter the suffix.", "Pre-populated from the SF-424."],
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
        (
          [
            [
              "Narrative/pattern",
              "^(?!\\s*\\S+(?:\\s+\\S+){300})[\\s\\S]*$",
              null,
            ],
          ] as const
        ).map(([key, plan, source]) => [
          key,
          {
            category: "intentional" as const,
            reason:
              "The original PDF explicitly limits the narrative to300words, while the XSD/DAT state1500characters. A standard string pattern counts whitespace-delimited tokens and is composed with the character bound. No compiler/renderer engine is added.300/301-word, newline, punctuation, blank and character-boundary cases qualify the declared interpretation; source-owner acceptance is separate.",
            plan,
            source,
          },
        ]),
      ),
    },
  },
};
