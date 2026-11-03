import { COLLAPSIBLE_FIELD_LIST, widgetOf } from "@/lib/collapsible";
import {
  and,
  isControl,
  rankWith,
  uiTypeIs,
  type JsonFormsRendererRegistryEntry,
} from "@jsonforms/core";
import {
  withJsonFormsControlProps,
  withJsonFormsLayoutProps,
} from "@jsonforms/react";

import { CollapsibleListControl } from "./collapsible/CollapsibleFieldList";
import FormSection from "./sections/FormSection";

/** Above the SGG adapter's 10, so these draw the elements they match instead. */
const RANK = 20;

/**
 * The form library's renderers, beside the SGG adapter's. Every group is a flat section whose
 * heading is sized to its depth and named in the breadcrumb. A list opts into the collapsible
 * list with `@UI.widget(Rendering.Widget.CollapsibleFieldList)`; without it the stock FieldList
 * draws it.
 */
export const previewRenderers: JsonFormsRendererRegistryEntry[] = [
  {
    tester: rankWith(RANK, uiTypeIs("Group")),
    renderer: withJsonFormsLayoutProps(FormSection),
  },
  {
    tester: rankWith(
      RANK,
      and(
        isControl,
        (uischema) => widgetOf(uischema) === COLLAPSIBLE_FIELD_LIST,
      ),
    ),
    renderer: withJsonFormsControlProps(CollapsibleListControl),
  },
];
