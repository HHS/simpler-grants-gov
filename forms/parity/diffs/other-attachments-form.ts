import type { FormDiff } from "../harness/model.ts";
import {
  ADDITIONAL_FILES,
  attachmentListMax,
  SGG_ATTACHMENT_WORDING,
} from "./common.ts";

export const DIFF: FormDiff = {
  slug: "other-attachments-form",
  xml: "xml-mapping",
  wording: SGG_ATTACHMENT_WORDING,
  dat: {
    absentFromPlan: { "2-1": ADDITIONAL_FILES },
    differingRules: { "1-0/maxOccurs": attachmentListMax(100) },
  },
};
