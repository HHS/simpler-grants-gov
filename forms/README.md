# Form library

This directory contains the source files used to:

- Outline the requirements for a given SGG form
- Validate those requirements against the upstream Grants.gov sources (DAT and XSD)
- Define the artifacts of a form (JSON schema, UI schema, XML mapping, rules schema) using TypeSpec
- Preview and validate that form definition against its requirements
- Ultimately generate and register the compiled form artifacts in the API so the form can be used in production.

If you're new here, start with the [tutorial](docs/tutorial.md). It walks through each of these steps for a single form, from writing its requirements to opening it in the apply experience.

## Directory structure

| Directory                      | Contents                                                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| [`specs/`](specs/)             | The TypeSpec definitions for each form, plus the question bank and XSD models they share.                                             |
| [`emitters/`](emitters/)       | Custom TypeSpec emitters that generate the XML mapping ([`xml`](emitters/xml/)) and the files the API needs ([`sgg`](emitters/sgg/)). |
| [`parity/`](parity/)           | Tests that compare each form's requirements and definition against the DAT and XSD.                                                   |
| [`site/`](site/)               | The form library site, used to review requirements and preview each form.                                                             |
| [`scripts/sync.mjs`](scripts/) | The script that copies compiled forms into the API.                                                                                   |
| [`docs/`](docs/)               | The [tutorial](docs/tutorial.md).                                                                                                     |
| `dist/`                        | Compiled output from the emitters. Not checked into git.                                                                              |

## Commands

These commands require Node 22 or 24 and should be run from `forms/`.

```bash
npm ci
npm run compile        # build the emitters, then compile every form into dist/
npm run clean          # delete dist/, e.g. after deleting or renaming a form
npm run test:parity    # download the Grants.gov sources, then run the parity tests
npm run test:emitters  # run the emitters' own tests
npm run sync           # copy each form marked @Sgg.sync into the API
npm run sync:check     # fail if a form in the API doesn't match its compiled output
```

`specs/main.tsp` imports every form, so a single compile builds all of them. `tspconfig.yaml` sets which emitters the compile runs.

## Adding a form

1. **Outline the requirements** in a form plan at `site/src/content/forms/<slug>.json`. The plan lists each field's label, help text and constraints, and links it to the matching DAT field and XSD element.
2. **Validate the requirements** with `npm run test:parity`, which checks the plan against the DAT and XSD.
3. **Define the form** in TypeSpec under `specs/forms/<id>/`, then import it from `specs/main.tsp`.
4. **Preview and validate the form** by running `npm run compile`, then `npm run test:parity` again. The form library site (`cd site && npm run dev`) shows the form alongside its requirements.
5. **Register the form in the API** by adding `@Sgg.sync` to it and running `npm run sync`. This writes the compiled artifacts to `api/src/form_schema/forms/<id>_generated/`. The form still has to be added to `_ALL_FORMS` by hand.
