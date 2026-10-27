# Specs

The TypeSpec the form library compiles. `main.tsp` imports every form; each form also
compiles on its own.

| Directory     | What it holds                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| `forms/<id>/` | One form: its data (`form.tsp`), layout (`layout.tsp`) and XSD model (`xsd.tsp`), all imported by `index.tsp`. |
| `questions/`  | The question bank: reusable questions, such as a person's name or an address.                                  |
| `xsd/`        | The XSD models every form shares, such as the Global Library's.                                                |
| `catalogue/`  | The tags and entities the question bank is filed under.                                                        |
| `mapping/`    | The mapping targets: `grantsGovXml`, written by the [`xml`](../emitters/xml/) emitter.                         |
| `ui/`         | The widgets `@UI.widget` can name.                                                                             |

Import another folder through its `#` alias (`#questions/*`, `#xsd/*`, ...), which
`package.json` declares, rather than a relative path.

## Adding a form

1. Add `forms/<id>/` with `form.tsp`, `layout.tsp`, `xsd.tsp` and an `index.tsp` that
   imports them.
2. Import its `index.tsp` from `main.tsp`.
3. Run `npm run compile`, then `npm run test:parity`.

The [tutorial](../docs/tutorial.md) walks through every step, plan and parity records
included.
