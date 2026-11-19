import { projectAbstractHappyPathTestData } from "tests/e2e/apply/fixtures/project-abstract-fill-data";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

const buildTestData = (): Record<string, string> => ({
  ...projectAbstractHappyPathTestData,
});

export const PROJECT_ABSTRACT_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "d3081452-2cf8-4817-9abf-812e5d794485",
  opportunityNumber: "E2E-PABS-ORG-IND-01",
  formKey: "projectAbstract",
  expectedPrepopulatedFields: {},
  buildTestData,
};

export const PROJECT_ABSTRACT_GENERATED_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "2e5d8bcd-bf18-449e-809c-15d21de7a22f",
  opportunityNumber: "E2E-PABSG-ORG-IND-01",
  formKey: "projectAbstractGenerated",
  expectedPrepopulatedFields: {},
  buildTestData,
};
