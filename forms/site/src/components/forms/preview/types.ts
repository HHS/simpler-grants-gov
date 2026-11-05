import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

/**
 * The contract between the preview shell and whatever draws the form. Keep renderers to
 * this shape so swapping one in is a change to `./index.ts` alone.
 */
export interface FormRendererProps {
  schema: JsonSchema;
  uischema: UISchemaElement;
  data: unknown;
  /** Show field-level validation warnings (the apply form shows them after save). */
  showErrors: boolean;
  /** Called on every edit with the new data and its warnings, worded by the renderer. */
  onChange: (data: unknown, warnings: string[]) => void;
}
