# Apply form component

This component takes form and UI schemas to create a form. The form schema conforms to JSON Schema and can take any shape as long as it conforms to JSON Schema.

[AjV](https://ajv.js.org) is used to validate the schema when saved.

The UI schema is custom for this project. It was inspired by [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form). RJSF was not chosen because it doesn't work with server actions, it doesn't support hierarchical UI layouts natively, and the validation will move to the API which reduces the value of the tightly coupled validation in RJSF. There is a [plugin for layouts](https://github.com/audibene-labs/react-jsonschema-form-layout), however it hasn't been updated in 4 years and still requires a lot of abstraction. This component provides most of the UI rendering with a ~100 line recursive function and uses the same library for validation. The widgets however are patterned after the RJSF widgets.

## UI Template

File adapted from https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/core/src/components/templates/BaseInputTemplate.tsx

## UI Schema

The UI Schema is an array of fields or sections.

### Fields

Fields can either reference a field in the form schema:

```
{
    type: "field",
    definition: "/properties/TestField",
}
```

or provide its own definitions that can supplement or override the form schema:

```
{
    type: "field",
    definition: "/properties/TestField",
    schema: {
        description: "This one is different"
    }
}
```

The corresponding form schema for that field would be:

```

"properties": {
   "TestField": {
      "type": "string",
      "title": "Date of application ",
      "description": "This will be overwritten the by the schema.description entry above"
      "format": "date"
  }
}

```

This can be used for descriptions or enums, but the form will fail if the UI Schema tries to change the field type as the validation is still determined by the form schema.

A field can have a `schema` without a `definition`. However, this field will only exist in the UI. When the form is saved the field will not be included in the form data sent to the server.

```
{
    type: "field",
    schema: {
        description: "This field will appear but not be saved",
        type: null
    }
}
```

### Determining field types

The field type for the form is inferred by inspecting the schema for the field. For example, a string field is by default an input field with type "text" while a string with `maxLength` greater than `255` is a text area field.

This can be overridden with the `widget` key in the UI Schema. Available widget types are `Checkbox`, `Radio`, `Select`, `Text`, and `TextArea`. For example:

```
{
   {
        type: "field",
        definition: "/properties/TestField1",
        widget: "TextArea"
    }
}
```

will produce a `<textarea/>` field in the form. It is possible to create fields without the correct schema elements, for example a `Select` widget without any `enum` entries will create an empty `<select/>` field.

### Sections

Sections wrap fields, or other sections:

```
{
    type: "section",
    name: "test",
    label: "test",
    children: [
    {
        type: "field",
        definition: "/properties/TestField1",
    },
    {
        type: "section",
        name: "test",
        label: "test",
        children: [
        {
            type: "field",
            definition: "/properties/TestField2",
        },
        ],
    },
    ],
}

```

## Using multiple definitions in a single field

Some widgets require data from more than one field. To add more than one field, use the `multiField` field type:

```
{
    "type": "multiField",
    "name": "Budget424aSectionA",
    "widget": "Budget424aSectionA",
    "definition": [
        "/properties/activity_line_items",
        "/properties/total_budget_summary"
    ]
}
```

In the widget, the data is available as a combined `value` object.

## Rules in the SGG UI schema

A node in an SGG UI schema can carry rules, such as `conditional`, which the form spec emitter writes to describe when a field is enabled, disabled or read-only. The SGG renderer doesn't act on these rules yet, so the fields they govern render unconditionally.

UI schema validation accepts any unknown _object-valued_ key on a node as a rule, so new rules can ship before the renderer supports them without breaking the form. Unknown string keys, like a mistyped `label` or `widget`, still fail validation. `getFormData` logs the rules a form declares that the renderer ignores (`unimplementedRuleKeys`).

## JSON Forms UI schema

Instead of the SGG UI schema described above, a form can use a [JSON Forms](https://jsonforms.io/docs/) UI schema. To opt in, the form's API response sets `form_renderer` to `"jsonforms"`. When `form_renderer` is `"sgg"` or missing, the form uses the SGG UI schema.

### Terminology

A field in a JSON Forms form can be rendered by three kinds of widget:

| Term                          | What it is                                                                                                                                   | Where it's used                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **SGG widget**                | One of the existing USWDS widgets in `widgets/`, patterned after RJSF widgets and registered in `widgetComponents`                           | Every field in an SGG form, and every field the SGG adapter can map in a JSON Forms form |
| **Custom JSON Forms widget**  | A component we write with JSON Forms' API (a tester plus `withJsonFormsControlProps` or `withJsonFormsLayoutProps`) instead of an SGG widget | The form library's sections and collapsible list. The apply form doesn't use any yet     |
| **JSON Forms vanilla widget** | A default component from `@jsonforms/vanilla-renderers`, like a bare `<input>`                                                               | Only as a fallback for controls SGG widgets can't render                                 |

The **SGG adapter** (`AdaptedControl`, `AdaptedLayout`) is what lets JSON Forms render a control with an SGG widget.

In this README, "renderer" means the form-level renderer: the SGG renderer, or the JSON Forms renderer in `JsonFormsFields`. JSON Forms' own API calls individual widgets "renderers" (e.g. the `renderers` and `extraRenderers` lists), but we call them widgets to keep the two apart.

### How it works

- **Layout and rules:** JSON Forms handles the layout and the rules that show, hide, enable or disable fields. Every field is still rendered by an SGG widget, through the same `renderFieldNode` → `getFieldConfig` → `renderWidget` path the SGG renderer uses.
- **Conversion:** `getFormData` converts the JSON Forms UI schema into an SGG UI schema with `jsonFormsToUiSchema`. Navigation, validation warnings and the UI schema validator all read the converted SGG UI schema. `JsonFormsFields` receives the original JSON Forms UI schema and uses it to render the form.
- **Saving and validation:** These work the same way as for SGG forms. Every widget submits under its SGG field name in the HTML `<form>`. JSON Forms runs with `validationMode="NoValidation"` and only evaluates rules, against a copy of the answers that's refreshed from the `<form>` on every input.

### How controls map to SGG UI schema nodes

| JSON Forms element                      | SGG UI schema node(s)                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Control on a scalar                     | One `field`                                                                                       |
| Control with `options.readonly: true`   | One `null` field (rendered disabled)                                                              |
| Control with `options.widget`           | One `field` with that `widget`                                                                    |
| Control on an object                    | One `field` per leaf of the object                                                                |
| Control on a top-level array of objects | One `fieldList`, whose fields follow `options.detail` when it's set and the item schema otherwise |
| `Group` with a `label`                  | A `section` named with `groupName(label)`                                                         |
| Any other layout                        | Its children, flattened into the parent                                                           |

### How widgets are picked

`JsonFormsFields` picks a widget for each element by rank. Each widget is registered with a tester that scores how well it matches an element, and the highest score wins:

| Rank     | Widgets                                                                  | Used for                                                    |
| -------- | ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| Below 10 | JSON Forms vanilla widgets                                               | The fallback for controls existing SGG widgets can't render |
| 10       | The SGG adapter (`AdaptedControl`, `AdaptedLayout`)                      | Everything else                                             |
| Above 10 | Custom JSON Forms widgets, registered in `renderers` or `extraRenderers` | Whatever their tester matches                               |

See [Adding a new widget](./widgets/README.md#adding-a-new-widget) for how to add one.

### Known limitations

These limitations come from the SGG widgets, not from JSON Forms. The SGG field-list widget renders each list entry itself, outside of JSON Forms, so JSON Forms never processes what's inside an entry:

- **Rules on fields inside a list aren't applied.** Those fields always show.
- **A list nested inside an object or a list entry isn't supported.** For example, a budget's line items (`budget.line_items`) or each key contact's phone numbers (`contacts[].phones`). It falls back to a JSON Forms vanilla widget, so its answers aren't saved.

The vanilla widget's answers aren't saved because the save action reads answers from the browser's `<form>` data, and the browser only includes inputs with a `name` attribute. Every SGG widget sets `name` to its field's path (e.g. `contacts[0]--role`), but the vanilla widget's `<input>` keeps its value in JSON Forms' own state and doesn't set `name`.

The server logs a warning when a form uses either one.

JSON Forms itself supports both. Its own list components render each entry through JSON Forms at that entry's path (e.g. `contacts.0`). A rule's condition is resolved relative to that path, so rules inside an entry are evaluated against that entry. A nested list inside an entry is rendered the same way. Replacing the SGG field-list widget with a custom JSON Forms list widget would remove both limitations.
