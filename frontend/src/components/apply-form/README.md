# Apply form component

This component takes form and UI schemas to create a form. The form schema conforms to JSON Schema and can take any shape as long as it conforms to JSON Schema.

[AjV](https://ajv.js.org) is used to validate the schema when saved.

The UI schema is custom for this project. It was inspired by [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form). RJSF was not chosen because it doesn't work with server actions, it doesn't support hierarchical UI layouts natively, and the validation will move to the API which reduces the value of the tightly coupled validation in RJSF. There is a [plugin for layouts](https://github.com/audibene-labs/react-jsonschema-form-layout), however it hasn't been updated in 4 years and still requires a lot of abstraction. This component provides most of the UI rendering with a ~100 line recursive function and uses the same library for validation. The widgets however are patterned after the RJSF widgets.

A form can use a [JSON Forms](https://jsonforms.io/docs/) UI schema instead. See the [JSON Forms renderer README](./jsonforms/README.md).

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
