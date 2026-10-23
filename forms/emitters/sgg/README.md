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

A form with `@Sgg.sync` must also have `@GrantsGov.form` (from
[`form-library-xml`](../xml/)), the identity the API registers it under.

## Output

One file per form, under `dist/sgg/`:

```
forms/<id>/sgg.json   { "sync": false | { "xml": boolean }, "grantsGov": { ... } | null }
```

The sync emitter reads these files and compiles the artifacts that the
`simpler-forms` and `form-library-xml` emitters wrote to `dist/canonical/`, then `scripts/sync.mjs` copies them into the correct directory in the API.

## Development

```bash
npm run build -w emitters/sgg          # also run by npm run compile
npm run check:types -w emitters/sgg
```
