import type { FormDiff } from "../harness/model.ts";
import { DIFF as budgetNarrative } from "./budget-narrative-attachment-form.ts";
import { DIFF as edAbstract } from "./ed-abstract-form.ts";
import { DIFF as epaKeyContacts } from "./epa-key-contacts.ts";
import { DIFF as keyContacts } from "./key-contacts.ts";
import { DIFF as nasaPiAndAor } from "./nasa-pi-and-aor.ts";
import { DIFF as nsfDeviation } from "./nsf-deviation-authorization.ts";
import { DIFF as nsfKeyPersonExpanded } from "./nsf-senior-key-person-profile-expanded.ts";
import { DIFF as nsfReviewers } from "./nsf-suggested-reviewers.ts";
import { DIFF as otherNarrative } from "./other-attachments-form.ts";
import { DIFF as projectAbstractSummary } from "./project-abstract-summary.ts";
import { DIFF as projectAbstract } from "./project-abstract.ts";
import { DIFF as projectNarrative } from "./project-narrative-attachment-form.ts";
import { DIFF as performanceSites } from "./project-performance-site-location-s.ts";
import { DIFF as rrKeyPersonExpanded } from "./research-and-related-senior-key-person-profile-expanded.ts";
import { DIFF as rrPersonalData } from "./research-related-personal-data.ts";
import { DIFF as rrKeyPerson } from "./research-related-senior-key-person-profile.ts";

/** Every form the suite checks. A plan with a `spec_id` must be listed here. */
export const DIFFS: FormDiff[] = [
  keyContacts,
  epaKeyContacts,
  projectNarrative,
  projectAbstract,
  edAbstract,
  budgetNarrative,
  otherNarrative,
  rrKeyPerson,
  rrKeyPersonExpanded,
  nsfKeyPersonExpanded,
  performanceSites,
  nsfDeviation,
  nsfReviewers,
  projectAbstractSummary,
  nasaPiAndAor,
  rrPersonalData,
];
