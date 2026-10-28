# simpler-forms-sgg

An SGG-specific emitter and decorators used to compile and register a form within the SGG API, and (in the future) generate SGG-specific schema files like rules schemas.

## Decorators

```tsp
import "simpler-forms-sgg";

@Meta.form(#{ id: "key-contacts", formName: "KEY CONTACTS" })
@Sgg.sync
@GrantsGov.form(#{ shortFormName: "Key_Contacts", formVersion: "2.0" })
model KeyContacts { ... }
```

- **`@Sgg.sync`** registers the form when `npm run sync` runs. A form without it still
  compiles and emits, but stays out of `api/src/form_schema/forms/`.
- **`@Sgg.sync(#{ xml: false })`** registers it without its XML transform rules, e.g.
  while they can't produce a valid document yet.
- **`@Sgg.sync(#{ xml: "mapping" })`** installs its XML mapping as `xml_mapping.json`, the
  format shaped like the XML, instead of `xml_transform.json`. The default is
  `xml: "transform"`.
- **`@Sgg.sync(#{ instructions: "<uuid>" })`** points the form at its instructions: the
  `form_instruction_id` of a form instruction record, uploaded to each environment with
  the API's `update-form-instruction` task (`api/src/task/forms/README.md`). Give each form
  its own record, even one that shares another form's PDF.
- **`@Sgg.sync(#{ sggVersion: "1.1" })`** sets the form's version in Simpler Grants, its
  `sgg_version`. It defaults to `1.0`.

A form with `@Sgg.sync` must also have `@GrantsGov.form` (from
[`form-library-xml`](../xml/)), the identity the API registers it under.

**`@Sgg.attachment`** marks a question whose answer is the id of one of the application's
uploads, as `Questions.Types.Attachment` is. Every form that asks one, or a scalar that
extends it, gets a rule schema that has the API check each id still belongs to the
application.

## Output

One file per form, and a rule schema for a form with attachments, under `dist/sgg/`:

```
forms/<id>/sgg.json           { "sync": false | { "xml": false | "transform" | "mapping", "sggVersion", "instructions"? }, "grantsGov": { ... } | null }
forms/<id>/rule-schema.json   { "<field>": { "gg_validation": { "rule": "attachment" } }, ... }
```

Set `property-casing` to match the `simpler-forms` emitter's, so the rule schema's keys
name the schema's properties.

The sync emitter reads these files and compiles the artifacts that the
`simpler-forms` and `form-library-xml` emitters wrote to `dist/canonical/`, then `scripts/sync.mjs` copies them into the correct directory in the API.

## Development

```bash
npm run build -w emitters/sgg          # also run by npm run compile
npm run check:types -w emitters/sgg
```
