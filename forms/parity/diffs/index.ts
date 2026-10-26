import { DIFF as subaward778 } from "./r-r-subaward-budget-attachment-s-form-10-yr-10-att.ts";
import { DIFF as subaward782 } from "./r-r-subaward-budget-attachment-s-form-5-yr-30-att.ts";
import { DIFF as subaward789 } from "./r-r-multi-project-subaward-budget-attachment-s-form-10yr-30att.ts";
import { DIFF as subaward715 } from "./research-related-subaward-budget-total-fed-non-fed-attachment-s-form.ts";
import { DIFF as subaward780 } from "./r-r-subaward-budget-attachment-s-form-10-yr-30-att.ts";
import { DIFF as subaward776 } from "./r-r-subaward-budget-attachment-s-form.ts";
import { DIFF as subaward732 } from "./phs-398-training-subaward-budget-attachment-s-form.ts";
import { DIFF as originalSF424D } from "./assurances-for-construction-programs-sf-424d.ts";
import { DIFF as originalSF424B } from "./assurances-for-non-construction-programs-sf-424b.ts";
import { DIFF as fnsDefinition0 } from "./grant-program-accounting-system-financial-capability-questionnaire-fns-906.ts";
import { DIFF as afriProjectType } from "./afri-project-type.ts";
import { DIFF as usdaAd1049 } from "./usda-ad-1049.ts";
import { DIFF as usdaAd1052 } from "./usda-ad-1052.ts";
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
  subaward778,
  subaward782,
  subaward789,
  subaward715,
  subaward780,
  subaward776,
  subaward732,
  originalSF424D,
  originalSF424B,
  fnsDefinition0,

  afriProjectType,
  usdaAd1049,
  usdaAd1052,
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
