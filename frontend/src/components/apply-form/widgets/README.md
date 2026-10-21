# USWDS React JSON Schema Widgets

These are based on the core widgets from [React JSON Schema](https://github.com/rjsf-team/react-jsonschema-form/tree/main/packages/core/src/components/widgets).

## Changes

They are adapted for the current project through a change in the props `UswdsWidgetProps` which makes:

- providing the `value` and `onChange` and other `on*` functions optional so the form can be submitted as a regular form instead of a JS only form
- `placeholder` is also not recommended by USWDS so is removed
- `aria-required` is substituted for `required` so the form can submit

## Adding a new widget

There are two ways to add a widget. An **SGG widget** works with both SGG and JSON Forms UI schemas. A **custom JSON Forms widget** only works with JSON Forms UI schemas, and uses JSON Forms' API instead of an SGG widget. See [Terminology](../README.md#terminology).

### An SGG widget (works with both UI schemas)

In a JSON Forms form, the SGG adapter renders every field through the same `renderFieldNode` → `getFieldConfig` → `renderWidget` path as the SGG renderer, so there's no JSON Forms-specific code to write.

1. Build the widget component in this folder. It takes `UswdsWidgetProps`, like the existing widgets.
2. Add the widget's name to `WidgetTypes` (`src/types/applyForm/types.ts`) and to `widgetComponents` (`Widgets.tsx`).
3. Add the name to the `widget` enum in `src/utils/applyForm/validateUiSchema.ts`.
4. Decide how a form picks the widget:
   - **Explicitly:** set `"widget": "<Name>"` on an SGG UI schema field, or `"options": { "widget": "<Name>" }` on a JSON Forms control.
   - **Automatically:** update `determineFieldType` in `src/utils/applyForm/getFieldConfig.ts` to choose the widget based on the field's JSON schema.

### A custom JSON Forms widget (JSON Forms UI schemas only)

A custom JSON Forms widget ranked above the SGG adapter (rank 10) takes over whatever its tester matches, so it doesn't need an SGG widget. The form library's section and collapsible list widgets are examples (`forms/site/src/components/forms/preview/renderers.ts`).

1. Write the widget with `withJsonFormsControlProps` (or `withJsonFormsLayoutProps`), and a tester ranked above 10.
2. Add it to the `renderers` list in `../jsonforms/renderers.tsx`. (JSON Forms calls individual widgets "renderers".)
3. Have the tester match a UI schema option, so only the controls that ask for the widget get it.
4. Follow the same rules as the SGG widgets, because saving and validation still go through the HTML `<form>`:
   - **Field names:** Render inputs with the same HTML field names the SGG widgets use (e.g. `address--city`, from `getFieldNameForHtml`). Otherwise the answers aren't saved.
   - **Validation warnings:** Read warnings from `AdapterContext` to show them on the widget's fields.
   - **Print mode:** Check `print` in the same context so the print view works.

> [!WARNING]
> Don't opt a single field into a custom JSON Forms widget with `options.widget` yet. The name is copied into the converted SGG UI schema, which `validateUiSchema` rejects, so the form shows an error page. Use a different option key until [#12853](https://github.com/HHS/simpler-grants-gov/issues/12853) is fixed. Lists aren't affected.
