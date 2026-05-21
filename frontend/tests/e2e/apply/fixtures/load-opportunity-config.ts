import { PROJECT_ABSTRACT_SUMMARY_FORM_CONFIG } from "tests/e2e/apply/fixtures/project-abstract-summary-field-definitions";
import type { FillFormConfig } from "tests/e2e/utils/forms/general-forms-filling";

import type {
  PrintViewOpportunityRegistry,
  ResolvedPrintViewForm,
  ResolvedPrintViewOpportunityConfig,
} from "./opportunity-print-view.types";
import opportunityRegistry from "./print-view-opportunities.json";

/**
 * Maps formKey → FillFormConfig (from form fixture).
 * Add a new entry here when a new form type is introduced.
 */
const FORM_CONFIG_REGISTRY: Record<string, FillFormConfig> = {
  projectAbstractSummary: PROJECT_ABSTRACT_SUMMARY_FORM_CONFIG,
};

/**
 * Resolves a print view opportunity config by opportunityNumber.
 *
 * The JSON is keyed directly by opportunityNumber, so lookup is O(1).
 * Each form's userEnteredFieldTestIds is derived from formConfig.fields using
 * printTestId ?? testId — no separate print-fields registry needed.
 *
 * @throws if no opportunity is registered for the given opportunityNumber
 * @throws if a form's formKey has no matching entry in FORM_CONFIG_REGISTRY
 */
export function loadOpportunityConfig(
  opportunityNumber: string,
): ResolvedPrintViewOpportunityConfig {
  const registry =
    opportunityRegistry as unknown as PrintViewOpportunityRegistry;
  const entry = registry[opportunityNumber];

  if (!entry) {
    throw new Error(
      `No print view opportunity registered for opportunityNumber: "${opportunityNumber}". ` +
        `Add it to tests/e2e/apply/fixtures/print-view-opportunities.json.`,
    );
  }

  const forms: ResolvedPrintViewForm[] = entry.forms.map((form) => {
    const formConfig = FORM_CONFIG_REGISTRY[form.formKey];
    if (!formConfig) {
      throw new Error(
        `No FillFormConfig registered for formKey: "${form.formKey}". ` +
          `Add it to FORM_CONFIG_REGISTRY in load-opportunity-config.ts.`,
      );
    }

    const userEnteredFieldTestIds = Object.fromEntries(
      Object.entries(formConfig.fields)
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
      formKey: form.formKey,
      formConfig,
      expectedPrepopulatedFields: form.expectedPrepopulatedFields,
      userEnteredFieldTestIds,
    };
  });

  return {
    opportunityId: entry.opportunityId,
    opportunityNumber,
    opportunityUrl: `/opportunity/${entry.opportunityId}`,
    forms,
  };
}
