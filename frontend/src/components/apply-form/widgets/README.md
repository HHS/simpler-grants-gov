# USWDS React JSON Schema Widgets

These are based on the core widgets from [React JSON Schema](https://github.com/rjsf-team/react-jsonschema-form/tree/main/packages/core/src/components/widgets).

## Changes

They are adapted for the current project through a change in the props `UswdsWidgetProps` which makes:

- providing the `value` and `onChange` and other `on*` functions optional so the form can be submitted as a regular form instead of a JS only form
- `placeholder` is also not recommended by USWDS so is removed
- `aria-required` is substituted for `required` so the form can submit
