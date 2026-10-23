# JSON Forms renderer

Instead of the [SGG UI schema](../README.md#ui-schema), a form can use a [JSON Forms](https://jsonforms.io/docs/) UI schema. To opt in, the form's API response sets `form_renderer` to `"jsonforms"`. When `form_renderer` is `"sgg"` or missing, the form uses the SGG UI schema.

## Terminology

A field in a JSON Forms form can be rendered by two kinds of widget:

| Term                         | What it is                                                                                                                                   | Where it's used                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **SGG widget**               | One of the existing USWDS widgets in `widgets/`, patterned after RJSF widgets and registered in `widgetComponents`                           | Every field in an SGG form, and every field the SGG adapter can map in a JSON Forms form |
| **Custom JSON Forms widget** | A component we write with JSON Forms' API (a tester plus `withJsonFormsControlProps` or `withJsonFormsLayoutProps`) instead of an SGG widget | The form library's sections and collapsible list. The apply form doesn't use any yet     |

The **SGG adapter** (`AdaptedControl`, `AdaptedLayout`) is what lets JSON Forms render a control with an SGG widget.

In these READMEs, "renderer" means the form-level renderer: the SGG renderer, or the JSON Forms renderer in `JsonFormsFields`. JSON Forms' own API calls individual widgets "renderers" (e.g. the `renderers` and `extraRenderers` lists), but we call them widgets to keep the two apart.

## How it works

- **Layout and rules:** JSON Forms handles the layout and the rules that show, hide, enable or disable fields. Every field is still rendered by an SGG widget, through the same `renderFieldNode` → `getFieldConfig` → `renderWidget` path the SGG renderer uses.
- **Conversion:** `getFormData` converts the JSON Forms UI schema into an SGG UI schema with `prepareJsonFormsUiSchema` (`prepareUiSchema.ts`), which calls `convertJsonFormsUiSchema` (`convertUiSchema.ts`) and logs what the conversion drops. Navigation, validation warnings and the UI schema validator all read the converted SGG UI schema. `JsonFormsFields` receives the original JSON Forms UI schema and uses it to render the form.
- **Saving and validation:** These work the same way as for SGG forms. Every widget submits under its SGG field name in the HTML `<form>`. JSON Forms runs with `validationMode="NoValidation"` and only evaluates rules, against a copy of the answers that's refreshed from the `<form>` on every input.

## How controls map to SGG UI schema nodes

| JSON Forms element                      | SGG UI schema node(s)                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Control on a scalar                     | One `field`                                                                                       |
| Control with `options.readonly: true`   | One `null` field (rendered disabled)                                                              |
| Control with `options.widget`           | One `field` with that `widget`, if it names an SGG widget                                         |
| Control on an object                    | One `field` per leaf of the object                                                                |
| Control on a top-level array of objects | One `fieldList`, whose fields follow `options.detail` when it's set and the item schema otherwise |
| `Group` with a `label`                  | A `section` named with `groupName(label)`                                                         |
| Any other layout                        | Its children, flattened into the parent                                                           |

## How widgets are picked

`JsonFormsFields` picks a widget for each element by rank. Each widget is registered with a tester that scores how well it matches an element, and the highest score wins. A control that can't be rendered by an existing SGG widget is skipped, so the applicant doesn't see it, and the server logs a warning for it:

| Rank     | Widgets                                                                  | Used for                                                                     |
| -------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 1        | `SkipControl`                                                            | Controls that can't be rendered by an existing SGG widget, which are skipped |
| 10       | The SGG adapter (`AdaptedControl`, `AdaptedLayout`)                      | Everything else                                                              |
| Above 10 | Custom JSON Forms widgets, registered in `renderers` or `extraRenderers` | Whatever their tester matches                                                |

See [Adding a new widget](../widgets/README.md#adding-a-new-widget) for an SGG widget, and [Adding a custom JSON Forms widget](#adding-a-custom-json-forms-widget) below.

## Known limitations

These limitations come from the SGG widgets, not from JSON Forms. The SGG field-list widget renders each list entry itself, outside of JSON Forms, so JSON Forms never processes what's inside an entry:

- **Rules on fields inside a list aren't applied.** Those fields always show.
- **A list nested inside an object or a list entry isn't supported.** For example, a budget's line items (`budget.line_items`) or each key contact's phone numbers (`contacts[].phones`). It's skipped, so the applicant doesn't see it and no answer is collected for it.

The server logs a warning when a form uses either one.

JSON Forms itself supports both. Its own list components render each entry through JSON Forms at that entry's path (e.g. `contacts.0`). A rule's condition is resolved relative to that path, so rules inside an entry are evaluated against that entry. A nested list inside an entry is rendered the same way. Replacing the SGG field-list widget with a custom JSON Forms list widget would remove both limitations.

## Adding a custom JSON Forms widget

A custom JSON Forms widget ranked above the SGG adapter (rank 10) takes over whatever its tester matches, so it doesn't need an SGG widget. The form library's section and collapsible list widgets are examples (`forms/site/src/components/forms/preview/renderers.ts`).

1. Write the widget with `withJsonFormsControlProps` (or `withJsonFormsLayoutProps`), and a tester ranked above 10.
2. Add it to the `renderers` list in `renderers.tsx`. (JSON Forms calls individual widgets "renderers".)
3. Have the tester match a UI schema option, so only the controls that ask for the widget get it.
4. Follow the same rules as the SGG widgets, because saving and validation still go through the HTML `<form>`:
   - **Field names:** Render inputs with the same HTML field names the SGG widgets use (e.g. `address--city`, from `getFieldNameForHtml`). Otherwise the answers aren't saved.
   - **Validation warnings:** Read warnings from `AdapterContext` to show them on the widget's fields.
   - **Print mode:** Check `print` in the same context so the print view works.
