import { DIFF as phsTrainingPlan } from "./phs-398-research-training-program-plan.ts";
import { DIFF as phsResearchPlan } from "./phs-398-research-plan.ts";
import { DIFF as document0 } from "./attachments.ts";
import { DIFF as document1 } from "./project-narrative-attachment-form.ts";
import { DIFF as document2 } from "./budget-narrative-attachment-form.ts";
import { DIFF as document3 } from "./other-attachments-form.ts";
import { DIFF as document4 } from "./project-abstract.ts";
import { DIFF as document5 } from "./project-abstract-summary.ts";
import { DIFF as document6 } from "./ed-abstract-form.ts";
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
  phsResearchPlan,
  phsTrainingPlan,
  document0,
  document1,
  document2,
  document3,
  document4,
  document5,
  document6,

  rrApplication,
  nonconstructionBudget,
  keyContacts,
  epaKeyContacts,
  rrKeyPerson,
  rrKeyPersonExpanded,
  nsfKeyPersonExpanded,
];
