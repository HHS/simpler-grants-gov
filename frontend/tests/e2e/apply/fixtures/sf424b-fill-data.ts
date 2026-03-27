import { ReadonlyFieldCheck } from "tests/e2e/utils/post-submission-utils";

export const sf424BHappyPathTestData = (
  orgLabel: string,
): Record<string, string> => ({
  title: "TESTER",
  organization: orgLabel,
});

// Readonly field checks derived from fill data — fieldIds match testIds in sf424b-field-definitions.ts
export const sf424BReadonlyFields = (
  orgLabel: string,
): ReadonlyFieldCheck[] => [
  { fieldId: "title", expectedValue: sf424BHappyPathTestData(orgLabel).title },
  {
    fieldId: "applicant_organization",
    expectedValue: sf424BHappyPathTestData(orgLabel).organization,
  },
];
