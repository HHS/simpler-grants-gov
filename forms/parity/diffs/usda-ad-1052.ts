import type { FormDiff } from "../harness/model.ts";

// Source-qualified assessed pairs, not a human source-policy waiver.
export const DIFF: FormDiff = {
  slug: "usda-ad-1052",
  dat: {
    differingLabels: {
      "01-1": {
        category: "intentional",
        plan: "* Federal Fiscal Year",
        source:
          "Certification Regarding Drug-Free Workplace State and State Agencies, Federal Fiscal Year",
        reason:
          "The field is labeled Federal Fiscal Year within the complete source State certification heading retained in the layout. Exactly four YEAR characters and XSD1.0 year0000 exclusion are explicit validation rules; only presentation wording is shortened.",
      },
      "02-A-8": {
        category: "intentional",
        plan: "* This certification is for a (check one)",
        source: "This certification is for a (check one)",
        reason:
          "The library displays required markers and omits trailing field punctuation while preserving the exact source question purpose, requiredness and owner. These are presentation differences, not source-constraint changes.",
      },
      "04-1": {
        category: "intentional",
        plan: "Check if there are workplaces on file that are not identified here.",
        source: "Check",
        reason:
          "The vague source Check label is expanded using the exact adjoining source workplace-on-file text, preserving an optional independent declaration and no inferred default.",
      },
      "05-1": {
        category: "intentional",
        plan: "* ORGANIZATION NAME",
        source: "ORGANIZATION NAME",
        reason:
          "The library displays required markers and omits trailing field punctuation while preserving the exact source question purpose, requiredness and owner. These are presentation differences, not source-constraint changes.",
      },
      "05-2": {
        category: "intentional",
        plan: "* PR/AWARD NUMBER OR PROJECT NAME",
        source: "PR/AWARD NUMBER OR PROJECT NAME",
        reason:
          "The library displays required markers and omits trailing field punctuation while preserving the exact source question purpose, requiredness and owner. These are presentation differences, not source-constraint changes.",
      },
      "06-3": {
        category: "intentional",
        plan: "* First Name",
        source: "First Name",
        reason:
          "The library displays required markers and omits trailing field punctuation while preserving the exact source question purpose, requiredness and owner. These are presentation differences, not source-constraint changes.",
      },
      "06-5": {
        category: "intentional",
        plan: "* Last Name",
        source: "Last Name",
        reason:
          "The library displays required markers and omits trailing field punctuation while preserving the exact source question purpose, requiredness and owner. These are presentation differences, not source-constraint changes.",
      },
      "06-7": {
        category: "intentional",
        plan: "* Title",
        source: "Title",
        reason:
          "The library displays required markers and omits trailing field punctuation while preserving the exact source question purpose, requiredness and owner. These are presentation differences, not source-constraint changes.",
      },
      "07-1": {
        category: "intentional",
        plan: "* SIGNATURE(S)",
        source: "SIGNATURE(S)",
        reason:
          "The library displays required markers and omits trailing field punctuation while preserving the exact source question purpose, requiredness and owner. These are presentation differences, not source-constraint changes.",
      },
      "07-2": {
        category: "intentional",
        plan: "* DATE",
        source: "DATE",
        reason:
          "The library displays required markers and omits trailing field punctuation while preserving the exact source question purpose, requiredness and owner. These are presentation differences, not source-constraint changes.",
      },
    },
    differingHelp: {
      "06-2": {
        category: "intentional",
        plan: "Enter the prefix.",
        source: "Pre-populated from the Application cover sheet.",
        reason:
          "The readonly cover-owned representative reuses the existing PersonName body and exact generic name-part help. Section guidance explicitly says supplied from the application cover and reviewed readonly. The exact original DAT Q is retained in this field pre_populated and source-help notes, without per-part question bodies or help overrides.",
      },
      "06-3": {
        category: "intentional",
        plan: "Enter the first name.",
        source: "Pre-populated from the Application cover sheet.",
        reason:
          "The readonly cover-owned representative reuses the existing PersonName body and exact generic name-part help. Section guidance explicitly says supplied from the application cover and reviewed readonly. The exact original DAT Q is retained in this field pre_populated and source-help notes, without per-part question bodies or help overrides.",
      },
      "06-4": {
        category: "intentional",
        plan: "Enter the middle name.",
        source: "Pre-populated from the Application cover sheet.",
        reason:
          "The readonly cover-owned representative reuses the existing PersonName body and exact generic name-part help. Section guidance explicitly says supplied from the application cover and reviewed readonly. The exact original DAT Q is retained in this field pre_populated and source-help notes, without per-part question bodies or help overrides.",
      },
      "06-5": {
        category: "intentional",
        plan: "Enter the last name.",
        source:
          "Pre-populated from the Application cover sheet. This field is required.",
        reason:
          "The readonly cover-owned representative reuses the existing PersonName body and exact generic name-part help. Section guidance explicitly says supplied from the application cover and reviewed readonly. The exact original DAT Q is retained in this field pre_populated and source-help notes, without per-part question bodies or help overrides.",
      },
      "06-6": {
        category: "intentional",
        plan: "Enter the suffix.",
        source: "Pre-populated from the Application cover sheet.",
        reason:
          "The readonly cover-owned representative reuses the existing PersonName body and exact generic name-part help. Section guidance explicitly says supplied from the application cover and reviewed readonly. The exact original DAT Q is retained in this field pre_populated and source-help notes, without per-part question bodies or help overrides.",
      },
    },
  },
  xsd: {
    differingRules: {
      "FiscalYear/minLength": {
        category: "intentional",
        plan: 4,
        source: null,
        reason:
          "DAT Form DAT row7 (N7/O7) requires exactly four YEAR characters. The root XSD declares xs:gYear, whose builtin lexical contract also admits signed years, extended years and timezone suffixes and exposes none of these identical explicit length/pattern facets to this comparison. The capture contract deliberately intersects the four-character DAT admission with XSD1.0 exclusion of year0000, preserving leading zeros as a string. This is a value-pinned source-layer restriction with verified lexical witnesses, not a waiver, numeric/calendar coercion or implementation of full gYear XML lowering.",
      },
      "FiscalYear/maxLength": {
        category: "intentional",
        plan: 4,
        source: null,
        reason:
          "DAT Form DAT row7 (N7/O7) requires exactly four YEAR characters. The root XSD declares xs:gYear, whose builtin lexical contract also admits signed years, extended years and timezone suffixes and exposes none of these identical explicit length/pattern facets to this comparison. The capture contract deliberately intersects the four-character DAT admission with XSD1.0 exclusion of year0000, preserving leading zeros as a string. This is a value-pinned source-layer restriction with verified lexical witnesses, not a waiver, numeric/calendar coercion or implementation of full gYear XML lowering.",
      },
      "FiscalYear/pattern": {
        category: "intentional",
        plan: "^(?!0000)[0-9]{4}$",
        source: null,
        reason:
          "DAT Form DAT row7 (N7/O7) requires exactly four YEAR characters. The root XSD declares xs:gYear, whose builtin lexical contract also admits signed years, extended years and timezone suffixes and exposes none of these identical explicit length/pattern facets to this comparison. The capture contract deliberately intersects the four-character DAT admission with XSD1.0 exclusion of year0000, preserving leading zeros as a string. This is a value-pinned source-layer restriction with verified lexical witnesses, not a waiver, numeric/calendar coercion or implementation of full gYear XML lowering.",
      },
      "PlaceofPerformance/ZipPostalCode/maxLength": {
        category: "upstream",
        plan: 10,
        source: 30,
        reason:
          "DAT O40 explicitly limits the entered postal value to10 characters while imported GlobalLibrary ZipPostalCodeDataType permits30. This use preserves the narrower DAT business rule and XSD-compatible output. Raw-XSD-valid postal lengths11..30 remain explicit negative capture controls; no shared scalar or source target is relaxed.",
      },
    },
  },
};
