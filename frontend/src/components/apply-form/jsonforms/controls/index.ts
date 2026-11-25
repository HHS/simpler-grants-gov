import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core";

/**
 * The native JSON Forms controls, each ranked above the SGG adapter (10). Add a new control
 * here; `renderers.tsx` registers this list.
 */
export const controls: JsonFormsRendererRegistryEntry[] = [];
