# USWDS React JSON Schema Widgets

These are based on the core widgets from [React JSON Schema](https://github.com/rjsf-team/react-jsonschema-form/tree/main/packages/core/src/components/widgets).

## Changes

They are adapted for the current project through a change in the props `UswdsWidgetProps` which makes:

- providing the `value` and `onChange` and other `on*` functions optional so the form can be submitted as a regular form instead of a JS only form
- `placeholder` is also not recommended by USWDS so is removed
- `aria-required` is substituted for `required` so the form can submit

## Adding a new widget

A widget here works with both SGG and JSON Forms UI schemas. In a JSON Forms form, the SGG adapter renders every field through the same `renderFieldNode` → `getFieldConfig` → `renderWidget` path as the SGG renderer, so there's no JSON Forms-specific code to write. For a widget only JSON Forms forms use, see [Adding a custom JSON Forms widget](../jsonforms/README.md#adding-a-custom-json-forms-widget).

1. Build the widget component in this folder. It takes `UswdsWidgetProps`, like the existing widgets.
2. Add the widget's name to `WidgetTypes` (`src/types/applyForm/types.ts`) and to `widgetComponents` (`Widgets.tsx`).
3. Add the name to the `widget` enum in `src/utils/applyForm/validateUiSchema.ts`, and to `FIELD_WIDGETS` in `../jsonforms/convertUiSchema.ts` if a JSON Forms control may name it.
4. Decide how a form picks the widget:
   - **Explicitly:** set `"widget": "<Name>"` on an SGG UI schema field, or `"options": { "widget": "<Name>" }` on a JSON Forms control.
   - **Automatically:** update `determineFieldType` in `src/utils/applyForm/getFieldConfig.ts` to choose the widget based on the field's JSON schema.
