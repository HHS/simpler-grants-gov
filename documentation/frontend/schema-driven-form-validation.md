# Schema-driven form validation

Schema-driven form validation allows frontend forms to reuse validation rules
defined by the API rather than maintaining separate copies of those rules in
the backend and frontend.

The general flow is:

```text
Backend Marshmallow schema
        |
        v
Generated OpenAPI specification
        |
        v
Generated Zod schema
        |
        +------------------------+
        |                        |
        v                        v
Client-side validation     Submit validation
        |                        |
        +-----------+------------+
                    |
                    v
          Translated field errors

API submission
        |
        v
Backend validation / 422 response
        |
        v
Same translated field-error handling
```

Where possible, validation rules should be defined once in the backend schema
and consumed by the frontend through generated Zod schemas.

## Form requirements

Schema-driven validation relies on a few conventions between the API schema,
generated Zod schema, and form.

### Field names

Form control `name` values must match the corresponding field name in the API
schema.

For example, given an API field:

```text
estimated_total_program_funding
```

the form control should use:

```tsx
<input
  name="estimated_total_program_funding"
  ...
/>
```

The same field name is used throughout the validation flow:

```text
API field
    |
    v
Zod property
    |
    v
FormData key (`name`)
    |
    v
validation error field
    |
    v
translation key
```

The field name passed to `getFieldError()` or `getFieldErrors()` must also match
the API/Zod field name.

This allows FormData values, Zod validation issues, API validation errors, and
translations to be associated with the correct field without maintaining
another mapping between frontend and API field names.

Fields whose browser representation cannot map directly to the API field, such
as checkbox groups or multiselects, may require a FormData adapter or other
form-specific handling.

### Field IDs

Each form control should have a stable, unique `id`.

The `id` does not technically need to match the API field name, although using
the field name when practical makes the relationship between the field,
validation state, label, and error easier to understand.

Field IDs should also be used to correctly associate labels and validation
messages with their controls for accessibility.

## Using `useZodFormValidation`

For client-side validation, use the shared `useZodFormValidation` hook.

A working example can be found in the Opportunity Edit form.

The hook is configured with:

- the generated Zod schema;
- validation errors returned by the server action;
- the form-specific translation namespace; and
- a function that converts `FormData` into the shape expected by the generated
  schema.

Example:

```tsx
const fieldTranslations = useTranslations(
  "OpportunityEdit.validationErrors",
);

const {
  getFieldError,
  getFieldErrors,
  handleFieldBlur,
  validateField,
} = useZodFormValidation({
  schema: OpportunitySummaryCreateRequestV1Schema,
  serverErrors: formState.validationErrors,
  fieldTranslations,
  getValidationData: (formData) =>
    getOpportunitySummaryValidationData(formData, {
      post_date: normalizeDateString(postDate) ?? postDate,
      close_date: closeDate
        ? (normalizeDateString(closeDate) ?? closeDate)
        : null,
    }),
});
```

The hook returns:

- `getFieldError(field)` - returns the first validation error for a field, or
  `undefined` when the field has no errors. Use this for form components that
  accept or display a single validation message.
- `getFieldErrors(field)` - returns all validation errors for a field as a
  `string[]`. Use this for form components that support multiple validation
  messages.
- `handleFieldBlur` - shared form-level blur handler for automatic field
  validation.
- `validateField(field, form)` - explicitly validates a field when a control
  cannot use the shared blur behavior.

Which error helper to use depends on the form component being rendered. Some
existing field components are designed around a single error message, while
others accept an array of validation errors. The validation infrastructure
preserves all errors for a field; `getFieldError()` is a convenience for
components that only consume one of them.

### Enable validation on blur

For normal form controls, attach `handleFieldBlur` to the form:

```tsx
<form
  onBlurCapture={handleFieldBlur}
  noValidate
>
```

Using `onBlurCapture` allows validation behavior to be handled in one place
rather than adding an `onBlur` handler to every input.

Although validation is triggered by interaction with a single field, the
complete form data is parsed against the generated schema. This is necessary
because some validation rules depend on multiple fields.

Only the appropriate field errors are surfaced to the user. Revalidating the
complete schema also allows previously displayed relational errors to be
removed when the relationship is fixed by changing another field.

For example:

1. the user changes post date so it is later than close date;
2. post date displays a relational validation error;
3. the user changes close date so it is later than post date; and
4. validation runs again and the stale post-date relational error can be
   removed.

### Displaying individual field errors

Use the error accessor expected by the field component.

For components that display a single validation message, use
`getFieldError()`:

```tsx
<FormGroup error={!!getFieldError("award_floor")}>
  <DynamicFieldLabel
    idFor="award_floor"
    title={t("labels.awardMinimum")}
  />

  {getFieldError("award_floor") ? (
    <ErrorMessage>
      {getFieldError("award_floor")}
    </ErrorMessage>
  ) : null}

  <TextInput
    id="award_floor"
    name="award_floor"
    type="text"
  />
</FormGroup>
```

For shared controls that accept an array of validation errors, use
`getFieldErrors()`:

```tsx
<CommonCharacterCount
  fieldId="agency_email_address"
  rawErrors={getFieldErrors("agency_email_address")}
  ...
/>
```

In the common case, the following values should all identify the same field:

```text
API/Zod property:           award_floor
FormData/input name:        award_floor
getFieldError argument:     award_floor
translation section:        award_floor
```

### DatePicker limitation

The current DatePicker implementation does not yet work cleanly with the
generic form-level blur handling.

DatePicker values are maintained in React state and normalized explicitly when
building validation data. DatePicker fields also currently call
`validateField()` directly on blur.

For example:

```tsx
<DatePicker
  id="post_date"
  name="post_date"
  defaultValue={initialValues.post_date}
  onChange={(value) => setPostDate(value ?? "")}
  onBlur={() => {
    if (formRef.current) {
      validateField("post_date", formRef.current);
    }
  }}
/>
```

This is a current implementation limitation rather than the preferred pattern.
Normal fields should continue to rely on the shared form-level blur handler.

## Backend schemas as the source of truth

API request validation is defined using backend Marshmallow schemas and
validators.

Standard schema information such as required fields, nullable fields, lengths,
numeric ranges, and supported formats is represented in the generated OpenAPI
specification. That specification is then used to generate frontend Zod
schemas.

When adding a validation rule that can be represented by the backend schema and
OpenAPI, prefer exposing it through the schema rather than creating an
equivalent handwritten frontend rule.

Some custom validators may need to provide additional OpenAPI metadata. For
example, an email validator can expose:

```yaml
type: string
format: email
```

The shared field infrastructure collects this metadata from validators so
individual field classes do not need special knowledge of each validator.

## Relational validation

Some validation rules depend on the relationship between multiple fields and
cannot be represented by the normal validation properties of a single OpenAPI
field.

Examples include:

- award floor must be less than or equal to award ceiling;
- award floor must be less than or equal to estimated total program funding;
- award ceiling must be less than or equal to estimated total program funding;
- post date must be less than or equal to close date.

These rules should use the shared backend relational validator.

A relational validation identifies the fields and comparison:

```yaml
x-relational-validations:
  - left_field: award_floor
    operator: less_than_or_equal
    right_field: award_ceiling
```

`x-relational-validations` is an OpenAPI specification extension used by our
Zod-generation process. It is not a standard OpenAPI validation keyword.

The Zod generation process converts this metadata into `.superRefine()`
validation on the generated schema. This allows the generated frontend schema
to enforce the same cross-field relationship as the backend.

Relational validation metadata is only needed in the OpenAPI specification used
for frontend schema generation and can be enabled for that generation path
without requiring it in the normal public API specification.

## FormData normalization

Browser `FormData` does not necessarily contain values in the representation
expected by an API schema. Most controls produce strings even when the API
expects another type.

The shared Zod/FormData utilities inspect the generated Zod schema and normalize
FormData before validation.

This includes handling values such as:

- numeric strings;
- formatted numeric strings;
- `"true"` and `"false"` boolean values;
- empty nullable values;
- missing values; and
- date strings.

Normalization is intentionally separate from validation. When possible, invalid
input is preserved and passed to Zod so the generated schema can produce the
appropriate validation error.

### Form-specific adapters

Not every browser representation can be inferred from a Zod field type.

Forms may provide adapters for fields that need custom FormData handling, such
as checkbox groups, multiselect controls, or other controls represented by
multiple browser inputs.

Adapters take precedence over generic schema-based normalization.

This keeps form-specific representation logic at the form boundary while
allowing ordinary fields to use shared conversion behavior.

## Client-side validation

Client-side validation uses the generated Zod schema to provide feedback while
the user interacts with the form.

Cross-field validation means that validating an isolated field is not always
sufficient. For example, determining whether:

```text
post_date <= close_date
```

requires both values.

The complete validation data is therefore parsed against the generated schema,
while the validation hook controls which resulting errors should currently be
shown to the user.

Client-side validation is a user experience feature and does not replace
validation during submission or validation performed by the API.

## Submit validation

The server action parses submitted FormData using the same generated Zod schema
before constructing the API request.

This provides a final validation and data-shaping boundary before making the API
request. It also means string-based FormData can be converted into data shaped
and typed according to the generated API schema.

Successful validation returns Zod's parsed output, which should be used to
construct the API request.

Failed validation is converted into the same field-error structure used by
client-side validation.

Client-side validation should not be treated as sufficient protection for a
server action because a server action can receive FormData independently of the
browser validation behavior.

## API validation and 422 responses

The API remains authoritative and performs its own validation.

A request may therefore still receive a `422` response even after frontend
validation succeeds.

API validation errors should be mapped into the same field-error representation
used for Zod validation. This allows errors detected by the API to use the same
translation and display behavior as errors detected before submission.

Raw backend validation messages should be treated as fallbacks rather than the
normal user-facing validation experience.

Errors that cannot be associated with a field in the current schema should
remain top-level form errors rather than being attached to an unrelated field.

### Page-level validation errors

Submit-time validation errors should also be surfaced in the page-level
validation alert or error summary used by the form.

The individual field errors and page-level errors should come from the same
validation result so the messages remain consistent.

Where an error-summary component supports navigation to fields, its entries
should link to the corresponding form control IDs.

## Validation message translations

Validation rules and user-facing messages are intentionally separate.

The validation hook receives a form-specific translation namespace:

```tsx
const fieldTranslations = useTranslations(
  "OpportunityEdit.validationErrors",
);
```

Translations are organized by field name and validation type.

For example:

```ts
validationErrors: {
  funding_instruments: {
    min_or_max_value: "Select at least one funding instrument.",
  },

  funding_categories: {
    min_or_max_value: "Select at least one funding category.",
  },

  expected_number_of_awards: {
    min_or_max_value:
      "Expected number of awards must be greater than or equal to zero and less than 1,000,000,000.",
  },

  award_floor: {
    min_or_max_value:
      "Award minimum must be greater than or equal to zero and less than $1,000,000,000,000,000.",

    award_ceiling_numeric_order:
      "Award minimum must be less than or equal to award maximum.",

    estimated_total_program_funding_numeric_order:
      "Award minimum must be less than or equal to estimated total program funding.",
  },

  award_ceiling: {
    min_or_max_value:
      "Award maximum must be greater than or equal to zero and less than $1,000,000,000,000,000.",

    award_floor_numeric_order:
      "Award maximum must be greater than or equal to award minimum.",

    estimated_total_program_funding_numeric_order:
      "Award maximum must be less than or equal to estimated total program funding.",
  },

  estimated_total_program_funding: {
    min_or_max_value:
      "Estimated total program funding must be greater than or equal to zero and less than $1,000,000,000,000,000.",

    award_floor_numeric_order:
      "Estimated total program funding must be greater than or equal to award minimum.",

    award_ceiling_numeric_order:
      "Estimated total program funding must be greater than or equal to award maximum.",
  },

  post_date: {
    required: "Publish date is required.",
    invalid: "Enter a valid publish date.",

    close_date_date_order:
      "Publish date must be on or before the close date.",
  },

  close_date: {
    invalid: "Enter a valid close date.",

    post_date_date_order:
      "Close date must be on or after the publish date.",
  },
}
```

Translation lookup follows this order:

1. field-specific validation message;
2. generic validation message;
3. original Zod or API message as a fallback.

For ordinary validation rules, generic translations should be preferred where
the wording is sufficiently clear.

Field-specific translations are useful when the message needs additional
context, particularly for relational validation.

For relational errors, the generated validation key includes the related field
and relationship type.

For example:

```text
award_floor.award_ceiling_numeric_order
```

means that the `award_floor` field failed a numeric ordering rule involving
`award_ceiling`.

Likewise:

```text
post_date.close_date_date_order
```

means that `post_date` failed a date-ordering rule involving `close_date`.

This allows the two sides of a relational validation to have messages written
from the perspective of the field where the error is displayed.

## Adding validation to a form

For a form backed by an API request schema:

1. Define validation rules in the backend Marshmallow schema.
2. Ensure validators expose appropriate OpenAPI metadata when necessary.
3. Define cross-field rules using the shared relational validator.
4. Regenerate the frontend Zod schemas.
5. Ensure form control `name` values match their API/Zod field names.
6. Use FormData adapters for controls that require specialized value handling.
7. Configure `useZodFormValidation` with the generated schema, translations,
   server errors, and validation-data function.
8. Add `onBlurCapture={handleFieldBlur}` to the form for interactive
   validation.
9. Render field errors with `getFieldError()` or `getFieldErrors()`.
10. Validate FormData with the generated Zod schema in the server action.
11. Construct the API request from the successfully parsed Zod output.
12. Map API `422` responses through the shared API validation mapper.
13. Surface submit errors through the form's page-level validation alert or
    error summary.
14. Add field-specific translations when a generic validation message does not
    provide enough context.

Avoid recreating validation rules manually in the component, server action, or
another handwritten frontend schema when the rule can be derived from the API
schema.

## Regenerating schemas

After backend schema or validation metadata changes, regenerate the frontend
Zod schemas:

```bash
npm run generate:zod
```

The generation command also generates the OpenAPI specification required by
the Zod generator, so these do not need to be run separately.

Generated Zod files should not be edited manually.

## Current limitations

The schema-driven validation infrastructure is still evolving.

Some areas may require additional shared handling as more forms adopt it,
particularly:

- DatePicker blur handling;
- complex nested schemas;
- arrays and multiselect FormData representations;
- specialized UI controls;
- additional Zod wrapper types;
- relational validations beyond the currently supported comparison operators;
- validation involving more than two fields.

When special handling is generally applicable, prefer extending the shared
schema-driven validation infrastructure rather than adding form-specific
validation logic.