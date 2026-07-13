import { PROJECT_ABSTRACT_SUMMARY_OPPORTUNITY_DATA } from "tests/e2e/apply/fixtures/project-abstract-summary-data";
import { PROJECT_ABSTRACT_SUMMARY_FORM_CONFIG } from "tests/e2e/apply/fixtures/project-abstract-summary-field-definitions";
import { SF424_OPPORTUNITY_DATA } from "tests/e2e/apply/fixtures/sf424-data";
import { SF424_FORM_CONFIG } from "tests/e2e/apply/fixtures/sf424-field-definitions";
import { SF424A_OPPORTUNITY_DATA } from "tests/e2e/apply/fixtures/sf424a-data";
import { SF424A_FORM_CONFIG } from "tests/e2e/apply/fixtures/sf424a-field-definitions";
import { SFLLL_OPPORTUNITY_DATA } from "tests/e2e/apply/fixtures/sfLLL-data";
import { SFLLL_FORM_CONFIG } from "tests/e2e/apply/fixtures/sfLLL-field-definitions";
import { SUPP_COVER_SHEET_NEH_OPPORTUNITY_DATA } from "tests/e2e/apply/fixtures/supp-cover-sheet-neh-grantsprogram-data";
import { SUPP_COVER_SHEET_NEH_FORM_CONFIG } from "tests/e2e/apply/fixtures/supp-cover-sheet-neh-grantsprogram-field-definitions";
import type { FillFormConfig } from "tests/e2e/utils/common/types";

import type {
  PrintViewFormData,
  ResolvedPrintViewForm,
  ResolvedPrintViewOpportunityConfig,
} from "./opportunity-print-view.types";

/**
 * Registry of all print view form data, imported from per-form data files.
 * Add a new entry here when a new form type is introduced.
 */
const PRINT_VIEW_FORM_DATA: PrintViewFormData[] = [
  PROJECT_ABSTRACT_SUMMARY_OPPORTUNITY_DATA,
  SF424_OPPORTUNITY_DATA,
  SF424A_OPPORTUNITY_DATA,
  SFLLL_OPPORTUNITY_DATA,
  SUPP_COVER_SHEET_NEH_OPPORTUNITY_DATA,
];

/**
 * Maps formKey -> FillFormConfig (from form fixture).
 * Add a new entry here when a new form type is introduced.
 */
const FORM_CONFIG_REGISTRY: Record<string, FillFormConfig> = {
  projectAbstractSummary: PROJECT_ABSTRACT_SUMMARY_FORM_CONFIG,
  sf424: SF424_FORM_CONFIG,
  sf424a: SF424A_FORM_CONFIG,
  sfLLL: SFLLL_FORM_CONFIG,
  suppCoverSheetNEH: SUPP_COVER_SHEET_NEH_FORM_CONFIG,
};

/**
 * Resolves a print view opportunity config by opportunityNumber.
 *
 * Each form's userEnteredFieldTestIds is derived from formConfig.fields using
 * printTestId ?? testId - no separate print-fields registry needed.
 *
 * @throws if no opportunity is registered for the given opportunityNumber
 * @throws if a form's formKey has no matching entry in FORM_CONFIG_REGISTRY
 */
export function loadOpportunityConfig(
  opportunityNumber: string,
): ResolvedPrintViewOpportunityConfig {
  const entries = PRINT_VIEW_FORM_DATA.filter(
    (e) => e.opportunityNumber === opportunityNumber,
  );

  if (entries.length === 0) {
    throw new Error(
      `No print view opportunity registered for opportunityNumber: "${opportunityNumber}". ` +
        `Add an entry to PRINT_VIEW_FORM_DATA in tests/e2e/utils/submission/load-opportunity-config.ts.`,
    );
  }

  const opportunityId = entries[0].opportunityId;

  const forms: ResolvedPrintViewForm[] = entries.map((entry) => {
    const formConfig = FORM_CONFIG_REGISTRY[entry.formKey];
    if (!formConfig) {
      throw new Error(
        `No FillFormConfig registered for formKey: "${entry.formKey}". ` +
          `Add it to FORM_CONFIG_REGISTRY in tests/e2e/utils/submission/load-opportunity-config.ts.`,
      );
    }

    const prepopulatedFieldKeys = new Set(
      Object.keys(entry.expectedPrepopulatedFields),
    );

    const userEnteredFieldTestIds = Object.fromEntries(
      Object.entries(formConfig.fields)
        .filter(([key]) => !prepopulatedFieldKeys.has(key))
        .map(
          ([key, def]) =>
            [key, def.printTestId ?? def.testId] as [
              string,
              string | undefined,
            ],
        )
        .filter((pair): pair is [string, string] => pair[1] !== undefined),
    );

    return {
      formKey: entry.formKey,
      formConfig,
      buildTestData: entry.buildTestData,
      expectedPrepopulatedFields: entry.expectedPrepopulatedFields,
      userEnteredFieldTestIds,
    };
  });

  return {
    opportunityId,
    opportunityNumber,
    opportunityUrl: `/opportunity/${opportunityId}`,
    forms,
  };
}
