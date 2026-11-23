import type { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";
import type { FormUnderTest } from "tests/e2e/utils/submission/scenarios-for-each-form";

import { NSF_KEY_PERSON_EXPANDED_GENERATED_OPPORTUNITY_DATA } from "./nsf-key-person-expanded-data";
import {
  NSF_KEY_PERSON_EXPANDED_FORM_MATCHER,
  NSF_KEY_PERSON_EXPANDED_REQUIRED_FIELD_ERRORS,
} from "./nsf-key-person-expanded-field-definitions";
import { RR_KEY_PERSON_GENERATED_OPPORTUNITY_DATA } from "./rr-key-person-data";
import { RR_KEY_PERSON_EXPANDED_GENERATED_OPPORTUNITY_DATA } from "./rr-key-person-expanded-data";
import {
  RR_KEY_PERSON_EXPANDED_FORM_MATCHER,
  RR_KEY_PERSON_EXPANDED_REQUIRED_FIELD_ERRORS,
} from "./rr-key-person-expanded-field-definitions";
import {
  RR_KEY_PERSON_FORM_MATCHER,
  RR_KEY_PERSON_REQUIRED_FIELD_ERRORS,
} from "./rr-key-person-field-definitions";

interface SeniorKeyPersonFormUnderTest extends FormUnderTest {
  formMatcher: RegExp;
  requiredFieldErrors: FieldError[];
}

/**
 * Each Senior/Key Person form generated from forms/specs. None has a hand-written
 * form, so each has an opportunity of its own.
 */
export const SENIOR_KEY_PERSON_OPPORTUNITIES: SeniorKeyPersonFormUnderTest[] = [
  {
    formLabel: "RESEARCH & RELATED Senior/Key Person Profile",
    opportunityNumber:
      RR_KEY_PERSON_GENERATED_OPPORTUNITY_DATA.opportunityNumber,
    formKey: RR_KEY_PERSON_GENERATED_OPPORTUNITY_DATA.formKey,
    formMatcher: RR_KEY_PERSON_FORM_MATCHER,
    requiredFieldErrors: RR_KEY_PERSON_REQUIRED_FIELD_ERRORS,
  },
  {
    formLabel: "RESEARCH & RELATED Senior/Key Person Profile (Expanded)",
    opportunityNumber:
      RR_KEY_PERSON_EXPANDED_GENERATED_OPPORTUNITY_DATA.opportunityNumber,
    formKey: RR_KEY_PERSON_EXPANDED_GENERATED_OPPORTUNITY_DATA.formKey,
    formMatcher: RR_KEY_PERSON_EXPANDED_FORM_MATCHER,
    requiredFieldErrors: RR_KEY_PERSON_EXPANDED_REQUIRED_FIELD_ERRORS,
  },
  {
    formLabel: "NSF Senior/Key Person Profile (Expanded)",
    opportunityNumber:
      NSF_KEY_PERSON_EXPANDED_GENERATED_OPPORTUNITY_DATA.opportunityNumber,
    formKey: NSF_KEY_PERSON_EXPANDED_GENERATED_OPPORTUNITY_DATA.formKey,
    formMatcher: NSF_KEY_PERSON_EXPANDED_FORM_MATCHER,
    requiredFieldErrors: NSF_KEY_PERSON_EXPANDED_REQUIRED_FIELD_ERRORS,
  },
];
