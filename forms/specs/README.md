# Specs

The TypeSpec the form library compiles. `main.tsp` imports every form; each form also
compiles on its own.

| Directory     | What it holds                                                                          |
| ------------- | -------------------------------------------------------------------------------------- |
| `forms/<id>/` | One form, in the files [below](#a-forms-files).                                        |
| `questions/`  | The question bank: reusable questions, such as a person's name or an address.          |
| `xsd/`        | The XSD models every form shares, such as the Global Library's.                        |
| `catalogue/`  | The tags and entities the question bank is filed under.                                |
| `mapping/`    | The mapping targets: `grantsGovXml`, written by the [`xml`](../emitters/xml/) emitter. |
| `ui/`         | The widgets `@UI.widget` can name.                                                     |

Import another folder through its `#` alias (`#questions/*`, `#xsd/*`, ...), which
`package.json` declares, rather than a relative path.

## A form's files

| File                 | What it holds                                                                        |
| -------------------- | ------------------------------------------------------------------------------------ |
| `index.tsp`          | Imports the others.                                                                  |
| `form.tsp`           | The form model: its questions, and the decorators that identify and install it.      |
| `layout.tsp`         | How an applicant is shown the form.                                                  |
| `fragments.tsp`      | Questions and models only this form uses, such as a person's profile. Optional.      |
| `examples.tsp`       | The example values `@example` decorators in `form.tsp` and `fragments.tsp` refer to. |
| `xsd.tsp`            | The form's XSD model, which maps each element from the form with `@Mapping.from`.    |
| `validation.test.ts` | Answers the compiled schema must accept or reject. Optional.                         |

Files with several parts separate them with `// ===` banners, the main part first.

`validation.test.ts` runs the form's examples and hand-edited answers through ajv
(draft 2020-12, with formats) via `loadFormValidator()` in
[`parity/harness/validate.ts`](../parity/harness/validate.ts). It covers the JSON schema
only: no rendering, API rules, signing, or submission. Run `npm run compile` first, then
`npx vitest run specs`.

## Adding a form

1. Add `forms/<id>/` with the files above.
2. Import its `index.tsp` from `main.tsp`.
3. Run `npm run compile`, then `npm run test:parity`.

The [tutorial](../docs/tutorial.md) walks through every step, plan and parity records
included.
