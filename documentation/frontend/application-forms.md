# Background

In order to accept grant applications from a user or organization, our system displays forms within the simpler grants UI. These forms are defined by two JSON schemas supplied by the system:

- a "form" schema - this defines the shape of the data represented by the form
- a "ui" schema - this defines the frontend representation of the form

These two schemas are combined using logic from the `<ApplyForm>` component to produce the usable form in the UI.

## Schemas

Both schemas are defined within the `form` table in the database:

- `form_json_schema` column holds the JSON for the "form" schema
- `form_ui_schema` column holds the JSON for the "ui" schema

The schemas are fetched by the frontend in page component at `/workspace/applications/application/[applicationID]/form/[appFormId]` (see https://github.com/HHS/simpler-grants-gov/blob/main/frontend/src/app/%5Blocale%5D/workspace/applications/application/%5BapplicationId%5D/form/%5BappFormId%5D/page.tsx), by hitting the API route at `/alpha/applications/<application_id>`. The schemas live at the `competition.competition_forms` as `form_json_schema` and `form_ui_schema` on the retrieved payload.

For examples of "ui" and "form" schemas, either:

- seed your local DB and look in the "form" table
- look at the basis for the seed at `/api/src/form_schema/forms`. These are the form schemas - the ui schemas are generated from the form schemas using logic in `api/src/form_schema/jsonschema_builder.py`. I believe (?????) this generation is only ever done manually by running `make dat-to-jsonschema`?

## Building the UI

See the logic in the `<ApplyForm>` component and related documentation for more info on how the UI is built.

# Resources

- the `<ApplyForm>` component, which creates the UI for a form based on UI and form schemas

  - https://github.com/HHS/simpler-grants-gov/blob/main/frontend/src/components/applyForm/README.md

- API documentation on form schema implementation

  - https://github.com/HHS/simpler-grants-gov/blob/main/api/src/form_schema/forms/README.md

- API documentation on extended schema rule definition
  - https://github.com/HHS/simpler-grants-gov/blob/main/api/src/form_schema/rule_processing/README.md
