# How to do forms

This is a work in progress!!!! Thank you for your understanding!!

Note that these guidelines apply in general to all forms in the application, but that some teams may have implemented response to these guidelines in different ways.

## Field management

In order to support easy data management, each field should follow a few common guidelines:

- name fields in the DOM with the same keys that are used to identify their data within the API. This way when the form is submitted, there won't be any need to translate names from the FormData into the submit request's JSON payload.
  - for example, if the API expects an "applicant_type" field, that field should be crated with `name` set to "applicant_type" in the DOM.
    - on submit, FormData is created using `name` attribute values as keys. This generally follows the [form submission spec](https://html.spec.whatwg.org/dev/form-control-infrastructure.html#form-submission-2), but [NextJS extends this (somehow)](https://nextjs.org/docs/app/guides/forms#how-it-works) by creating FormData and passing it to the action function rather than passing key / values as parameters to a target url.
  - you can, of course, still label fields however you want in the UI
  - if fields are nested, use standard nesting notation when naming the field in the DOM so it can be easily expanded into JSON.
    - for example a "city" field nested under "address" could be implemented with `name` set as "city.address" or "city--address", depending on the nesting separator you choose to use ([see relevant code here](https://github.com/HHS/simpler-grants-gov/blob/57a9707d24644b8f3875c47554330e5709018bb4/frontend/src/utils/formData/formDataToJson.ts#L23))

### Array fields

Array fields can be implemented in a few ways:

- multiselect dropdowns!
- checkbox groups!
- arbitrary field lists!

In order for form data to pick up the correct key / value pairs for array fields, keys must be set using array notation (ex `agencies[0]`), and values must be set as individual values for each index. In that context, following the usual process used on other field types - setting a `name` attribute to match the data key - won't work in this situation, and the inputs used in the UI to select values for your array fields will not directly map onto the resulting form data.

As such, in most cases it's going to be easiest to implement array fields with `name` set to `""`. This means that each checkbox in a group, or each multiselect input, would have an empty name attribute. (Setting an empty `name` does violate the HTML spec, but it works regardless. If removing `name` entirely works, you can also do that.)

In this setup, instead of pulling the value for the field directly from each input on submit, when the value of the input changes, we can save it in an array in local state, and then iterate over the state values to create hidden inputs with values and keys in a format that is easier for us to work with.

Each hidden input should be named with the name of the field, and the index of the selected value in array notation. For example, if 3 values are selected from a checkbox group for an "agencies" field, they would named `agencies[0]`, `agencies[1]`, `agencies[2]`.

For an example, see how this is done in the `MultiSelectWidget` [component here](https://github.com/HHS/simpler-grants-gov/blob/99bd434a000d985754d2ce5ae2bfda01b25f9608/frontend/src/components/apply-form/widgets/MultiSelectWidget.tsx#L161)

This may seem counterituitive, but is suggested because:

- when naming array fields directly, the format of the selected values is more difficult to work with
- this allows us to have a uniform data implementation for all array fields regardless of their UI implemenetation

#### Psuedocode Example

```
const ArrayField = () => {
  const [selected, setSelected] = useState([])
  const addSelected = (val: string): void => {
    setSelected([...selected, val);
  };
  return (
    <>
      {/* Hidden inputs so your form posts an array */}
      {selected.map((v, i) => (
        <input
          type="hidden"
          name={`${id}[${i}]`}
          value={v}
        />
      ))}
      <ComboBox
       ...
        name={""}
        onChange={(val?: string) => {
          addSelected(val);
        }}
      />
    </>
  )
}
```

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

Default values for empty fields are set when calling `formDataToObject`. Due to how validations are implemented on the API, in all cases other than apply forms (where the default should be `undefined`), the default value should be `null`. Due to how JS functions handle default values and `undefined`, this argument needs to be specified on each call to `formDataToObject`, and we can't rely on it defaulting to `null`.

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
