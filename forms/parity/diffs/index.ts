import { DIFF as phsAssignmentRequest } from "./phs-assignment-request-form.ts";
import { DIFF as nsfDeviation } from "./nsf-deviation-authorization.ts";
import { DIFF as nsfReviewers } from "./nsf-suggested-reviewers.ts";
import { DIFF as assuranceIndividual } from "./assurances-for-non-construction-programs-sf-424b-individual.ts";
import { DIFF as rrApplication } from "./sf424-r-r.ts";
import { DIFF as nonconstructionBudget } from "./budget-information-for-non-construction-programs-sf-424a.ts";
import type { FormDiff } from "../harness/model.ts";
import { DIFF as epaKeyContacts } from "./epa-key-contacts.ts";
import { DIFF as keyContacts } from "./key-contacts.ts";
import { DIFF as nsfKeyPersonExpanded } from "./nsf-senior-key-person-profile-expanded.ts";
import { DIFF as rrKeyPersonExpanded } from "./research-and-related-senior-key-person-profile-expanded.ts";
import { DIFF as rrKeyPerson } from "./research-related-senior-key-person-profile.ts";

/** Every form the suite checks. A plan with a `spec_id` must be listed here. */
export const DIFFS: FormDiff[] = [
  phsAssignmentRequest,
  nsfDeviation,
  nsfReviewers,

  assuranceIndividual,
  rrApplication,
  nonconstructionBudget,
  keyContacts,
  epaKeyContacts,
  rrKeyPerson,
  rrKeyPersonExpanded,
  nsfKeyPersonExpanded,
];
