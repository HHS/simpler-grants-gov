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
  rrApplication,
  nonconstructionBudget,
  keyContacts,
  epaKeyContacts,
  rrKeyPerson,
  rrKeyPersonExpanded,
  nsfKeyPersonExpanded,
];
