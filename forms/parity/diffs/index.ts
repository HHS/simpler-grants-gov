import type { FormDiff } from "../harness/model.ts";
import { DIFF as epaKeyContacts } from "./epa-key-contacts.ts";
import { DIFF as keyContacts } from "./key-contacts.ts";
import { DIFF as nsfKeyPersonExpanded } from "./nsf-senior-key-person-profile-expanded.ts";
import { DIFF as performanceSites } from "./project-performance-site-location-s.ts";
import { DIFF as rrKeyPersonExpanded } from "./research-and-related-senior-key-person-profile-expanded.ts";
import { DIFF as rrKeyPerson } from "./research-related-senior-key-person-profile.ts";

import { DIFF as individual } from "./application-for-federal-domestic-assistance-individual.ts";
import { DIFF as mandatory } from "./sf424-mandatory-form.ts";

/** Every form the suite checks. A plan with a `spec_id` must be listed here. */
export const DIFFS: FormDiff[] = [
  keyContacts,
  epaKeyContacts,
  rrKeyPerson,
  rrKeyPersonExpanded,
  nsfKeyPersonExpanded,
  performanceSites,
  individual,
  mandatory,
];
