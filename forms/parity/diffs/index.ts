import type { FormDiff } from "../harness/model.ts";
import { DIFF as budgetNarrative } from "./budget-narrative-attachment-form.ts";
import { DIFF as epaKeyContacts } from "./epa-key-contacts.ts";
import { DIFF as keyContacts } from "./key-contacts.ts";
import { DIFF as nsfKeyPersonExpanded } from "./nsf-senior-key-person-profile-expanded.ts";
import { DIFF as otherNarrative } from "./other-attachments-form.ts";
import { DIFF as projectNarrative } from "./project-narrative-attachment-form.ts";
import { DIFF as performanceSites } from "./project-performance-site-location-s.ts";
import { DIFF as rrKeyPersonExpanded } from "./research-and-related-senior-key-person-profile-expanded.ts";
import { DIFF as rrKeyPerson } from "./research-related-senior-key-person-profile.ts";

/** Every form the suite checks. A plan with a `spec_id` must be listed here. */
export const DIFFS: FormDiff[] = [
  keyContacts,
  epaKeyContacts,
  projectNarrative,
  budgetNarrative,
  otherNarrative,
  rrKeyPerson,
  rrKeyPersonExpanded,
  nsfKeyPersonExpanded,
  performanceSites,
];
