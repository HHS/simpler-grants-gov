import { loadOpportunityConfig } from "./load-opportunity-config";
import type {
  ResolvedPrintViewForm,
  ResolvedPrintViewOpportunityConfig,
} from "./opportunity-print-view.types";

/**
 * One version of a form a spec runs against, such as a hand-written form or the
 * copy generated from forms/specs, and the opportunity that offers it.
 */
export interface FormUnderTest {
  /** Prefixes each test name, so a failure names the form. */
  formLabel: string;
  opportunityNumber: string;
  formKey: string;
}

/**
 * Repeats a spec's scenarios once for each form, so one spec covers every version.
 *
 * Each returned scenario's `testName` is prefixed with the form's label, and it includes
 * the opportunity to apply to and the form's resolved config.
 *
 * @throws if a form's opportunity does not offer a form with its formKey
 */
export function scenariosForEachForm<Scenario extends { testName: string }>(
  forms: readonly FormUnderTest[],
  scenarios: readonly Scenario[],
): (Scenario & {
  opportunityConfig: ResolvedPrintViewOpportunityConfig;
  form: ResolvedPrintViewForm;
})[] {
  return forms.flatMap(({ formLabel, opportunityNumber, formKey }) => {
    const opportunityConfig = loadOpportunityConfig(opportunityNumber);
    const form = opportunityConfig.forms.find(
      (candidate) => candidate.formKey === formKey,
    );
    if (!form) {
      throw new Error(
        `Opportunity "${opportunityNumber}" has no form with formKey "${formKey}".`,
      );
    }
    return scenarios.map((scenario) => ({
      ...scenario,
      testName: `${formLabel} - ${scenario.testName}`,
      opportunityConfig,
      form,
    }));
  });
}
