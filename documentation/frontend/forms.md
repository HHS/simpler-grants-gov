# How to do forms

This is a work in progress!!!! Thank you for your understanding!!

Note that these guidelines apply in general to all forms in the application, but taht some teams may have implemented response to these guidelines in different ways.

## Field management

In order to support easy data management, each field should follow a few common guidelines:

- name fields in the DOM with the same keys that are used to identify their data within the API. This way when the form is submitted, there won't be any need to translate names from the FormData into the submit request's JSON payload.
  - for example, if the API expects an "applicant_type" field, that field should be crated with `name` set to "applicant_type" in the DOM.
  - you can, of course, still label fields however you want in the UI
  - if fields are nested, use standard nesting notation when naming the field in the DOM so it can be easily expanded into JSON.
    - for example a "city" field nested under "address" could be implemented with `name` set as "city.address" or "city--address"
- more TBD

### Array fields

Array fields can be implemented in a few ways:

- multiselect dropdowns!
- checkbox groups!
- arbitrary field lists!

In most cases it's going to be easiest to implement array fields with `name` set to `""`. This means that each checkbox in a group, or each multiselect input, would have an empty name attribute.

In this setup, instead of pulling the value for the field directly from each input on submit, when the value of the input changes, we can save it in an array in local state, and then iterate over the state values to create hidden inputs with values and keys in a format that is easier for us to work with.

Each hidden input should be named with the name of the field, and the index of the selected value in array notation. For example, if 3 values are selected from a checkbox group for an "agencies" field, they would named `agencies[0]`, `agencies[1]`, `agencies[2]`.

For an example, see how this is done in the `MultiSelectWidget` [component here](https://github.com/HHS/simpler-grants-gov/blob/99bd434a000d985754d2ce5ae2bfda01b25f9608/frontend/src/components/apply-form/widgets/MultiSelectWidget.tsx#L161)

This may seem counterituitive, but is suggested because:

- when naming array fields directly, the format of the selected values is more difficult to work with
- this allows us to have a uniform data implementation for all array fields regardless of their UI implemenetation

## Server actions

Form submission functionality should be handled by server functions!

## Data management

### Form data -> Json

On each form submission, it will necessary to translate form data (or more technically FormData) into a formatted JSON payload suitable for sending to the API.

[A utility function exists to handle this here](https://github.com/HHS/simpler-grants-gov/blob/99bd434a000d985754d2ce5ae2bfda01b25f9608/frontend/src/utils/formData/formDataToJson.ts#L94)

This `formDataToObject` function will:

- convert all data fields into their proper types
  - all FormData values are either strings or Blobs (Files) so in order to support numbers, booleans, arrays, etc., some conversion needs to happen here
- convert formData into a nested JSON object shape

In order to do proper type conversion, the function needs to know what types to use for each field. This information comes in the form of a simple data schema object that looks something like this.

```
{
  opportunity_id: { type: "string" },
  funding_instruments: { items: { type: "string" } }, // array
}
```

Notice that array data types should be denoted with `{ items: { type: <your-type> } }`

### Existing data -> UI

tbd

## Validation

[General validation rules for the project are found here](https://navasage.atlassian.net/wiki/x/R4ALwQ).

On a technical level, this means to be sure to handle all 422 errors in an intelligent way, such that the validation errors that come back in the payload with the response are surfaced in the UI.

More implementation details TBD

## In form navigation

## Field labels

## Accessibility

## Shared components
