import type { FormDiff } from "../harness/model.ts";
import {
  ADDITIONAL_FILES,
  attachmentListMax,
  SGG_ATTACHMENT_WORDING,
} from "./common.ts";

export const DIFF: FormDiff = {
  slug: "project-narrative-attachment-form",
  xml: "xml-mapping",
  wording: SGG_ATTACHMENT_WORDING,
  dat: {
    absentFromPlan: { "2-0": ADDITIONAL_FILES },
    differingRules: { "1-0/maxOccurs": attachmentListMax(100) },
  },
};
