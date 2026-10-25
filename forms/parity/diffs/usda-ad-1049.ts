import type { FormDiff } from "../harness/model.ts";

// Exact v1 observed values. Entries become stale when either compared wording changes.
// Order is path-keyed by the existing harness; the observed positions are stated in its reason.
export const DIFF: FormDiff = {
  slug: "usda-ad-1049",
  dat: {
    outOfOrder: {
      "05-1": {
        category: "intentional",
        reason:
          "The readonly cover-owned Organization Name is reviewed in the first Certification section (plan position0 versus DAT position9). The source workplaces remain optional and retain their own entered-answer section. This presentation order preserves source ownership, every field and the separate source-shaped XML sequence; it does not change XML output order or legal scope.",
      },
    },
    differingLabels: {
      "05-1": {
        category: "intentional",
        plan: "* ORGANIZATION NAME",
        source: "ORGANIZATION NAME",
        reason:
          "The plan presents the source-required field with the library required asterisk. DAT D marks this field Yes and its source requiredness is preserved; the asterisk is a presentation marker, not a new applicant obligation or changed ownership.",
      },
      "04-1": {
        category: "intentional",
        plan: "Check if there are workplaces on file that are not identified here.",
        source: "Check",
        reason:
          'The vague source Check label is expanded with the exact adjoining DAT B41 text, "if there are workplaces on file that are not identified here." This makes the optional on-file declaration intelligible without adding an answer, default or certification.',
      },
      "05-2": {
        category: "intentional",
        plan: "* PR/AWARD NUMBER OR PROJECT NAME",
        source: "PR/AWARD NUMBER OR PROJECT NAME",
        reason:
          "The plan presents the source-required field with the library required asterisk. DAT D marks this field Yes and its source requiredness is preserved; the asterisk is a presentation marker, not a new applicant obligation or changed ownership.",
      },
      "06-3": {
        category: "intentional",
        plan: "* First Name",
        source: "First Name",
        reason:
          "The plan presents the source-required field with the library required asterisk. DAT D marks this field Yes and its source requiredness is preserved; the asterisk is a presentation marker, not a new applicant obligation or changed ownership.",
      },
      "06-5": {
        category: "intentional",
        plan: "* Last Name",
        source: "Last Name",
        reason:
          "The plan presents the source-required field with the library required asterisk. DAT D marks this field Yes and its source requiredness is preserved; the asterisk is a presentation marker, not a new applicant obligation or changed ownership.",
      },
      "06-7": {
        category: "intentional",
        plan: "* Title",
        source: "Title",
        reason:
          "The plan presents the source-required field with the library required asterisk. DAT D marks this field Yes and its source requiredness is preserved; the asterisk is a presentation marker, not a new applicant obligation or changed ownership.",
      },
      "07-1": {
        category: "intentional",
        plan: "* SIGNATURE(S)",
        source: "SIGNATURE(S)",
        reason:
          "The plan presents the source-required field with the library required asterisk. DAT D marks this field Yes and its source requiredness is preserved; the asterisk is a presentation marker, not a new applicant obligation or changed ownership.",
      },
      "07-2": {
        category: "intentional",
        plan: "* DATE",
        source: "DATE",
        reason:
          "The plan presents the source-required field with the library required asterisk. DAT D marks this field Yes and its source requiredness is preserved; the asterisk is a presentation marker, not a new applicant obligation or changed ownership.",
      },
    },
    differingHelp: {
      "06-2": {
        category: "intentional",
        plan: "Enter the prefix.",
        source: "Pre-populated from the Application cover sheet.",
        reason:
          "The readonly source-owned representative reuses the existing PersonName body and its exact generic name-part help. The Authorized Representative section explicitly says these values are supplied from the application cover and are reviewed read-only. The exact original DAT help is retained in this plan field pre_populated and the source-help notes; ownership and requiredness remain unchanged. No per-part question body or help override is introduced.",
      },
      "06-3": {
        category: "intentional",
        plan: "Enter the first name.",
        source: "Pre-populated from the Application cover sheet.",
        reason:
          "The readonly source-owned representative reuses the existing PersonName body and its exact generic name-part help. The Authorized Representative section explicitly says these values are supplied from the application cover and are reviewed read-only. The exact original DAT help is retained in this plan field pre_populated and the source-help notes; ownership and requiredness remain unchanged. No per-part question body or help override is introduced.",
      },
      "06-4": {
        category: "intentional",
        plan: "Enter the middle name.",
        source: "Pre-populated from the Application cover sheet.",
        reason:
          "The readonly source-owned representative reuses the existing PersonName body and its exact generic name-part help. The Authorized Representative section explicitly says these values are supplied from the application cover and are reviewed read-only. The exact original DAT help is retained in this plan field pre_populated and the source-help notes; ownership and requiredness remain unchanged. No per-part question body or help override is introduced.",
      },
      "06-5": {
        category: "intentional",
        plan: "Enter the last name.",
        source:
          "Pre-populated from the Application cover sheet. This field is required.",
        reason:
          "The readonly source-owned representative reuses the existing PersonName body and its exact generic name-part help. The Authorized Representative section explicitly says these values are supplied from the application cover and are reviewed read-only. The exact original DAT help is retained in this plan field pre_populated and the source-help notes; ownership and requiredness remain unchanged. No per-part question body or help override is introduced.",
      },
      "06-6": {
        category: "intentional",
        plan: "Enter the suffix.",
        source: "Pre-populated from the Application cover sheet.",
        reason:
          "The readonly source-owned representative reuses the existing PersonName body and its exact generic name-part help. The Authorized Representative section explicitly says these values are supplied from the application cover and are reviewed read-only. The exact original DAT help is retained in this plan field pre_populated and the source-help notes; ownership and requiredness remain unchanged. No per-part question body or help override is introduced.",
      },
    },
  },
};
