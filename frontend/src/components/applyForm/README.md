# Apply form component

This component takes form and UI schemas to create a form. The form schema conforms to JSON Schema and can take any shape as long as it conforms to JSON Schema.

[AjV](https://ajv.js.org) is used to validate the schema when saved.

The UI schema is custom for this project. It was inspired by [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form). RJSF was not chosen because it doesn't work with server actions, it doesn't support hierarchical UI layouts natively, and the validation will move to the API which reduces the value of the tightly coupled validation in RJSF. There is a [plugin for layouts](https://github.com/audibene-labs/react-jsonschema-form-layout), however it hasn't been updated in 4 years and still requires a lot of abstraction. This component provides most of the UI rendering with a ~100 line recursive function and uses the same library for validation. The widgets however are patterned after the RJSF widgets.

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

This can be used for descriptions or enums, but the form will fail if the UI Schema tries to change the field type as the validation is still determined by the form schema.

A field can only exist with the `schema` key in the UI schema, however it won't be saved:

```
{
    type: "field",
    schema: {
        description: "This field will appear but not be saved",
        type: null
    }
}
```

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
