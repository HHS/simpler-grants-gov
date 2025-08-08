import { UiSchema } from "src/components/applyForm/types";

export function formHasAttachmentFields(uiSchema: UiSchema): boolean {
  for (const item of uiSchema) {
    if (item.type === "field" && item.widget?.startsWith("Attachment")) {
      return true;
    }

    if (item.type === "section" && Array.isArray(item.children)) {
      if (formHasAttachmentFields(item.children)) {
        return true;
      }
    }
  }
  return false;
}
