# Form library site

An Astro site listing every form's plan and, for a form with a spec, its field tree,
its comparison with the DAT and XSD, and a preview of the compiled form.

## Sample data before a preview

A plan can include optional `examples`, each with a `label`, `description` and `data`
object containing illustrative answers. These appear in the **Data** tab and can be
downloaded as JSON without a `spec_id` or TypeSpec definition. No schema is generated
from an example. Use synthetic values and state any proposed representation choices.

For an already implemented form, `existing_sgg` can hold a pinned `source_url` and
`examples` from maintained SGG fixtures. Data displays these separately for comparison;
their paths follow the existing contract, so they are not checked against the proposal.
Keep the source revision in the URL and distinguish test fixtures from realistic samples.

The shared plan validator checks that example answers use declared field `json_path`s,
including repeated `[]` entries. It does not validate values, requiredness, cardinality,
calculations, submission defaults or XML. Those need the actual definition and runtime
checks. Keep examples independent from the compiled preview's live answer store; on a
form with both, Data shows proposed samples and live preview data separately.

SF-424A is the first example; its [existing-SGG comparison](../docs/sf424a-plan-review.md)
records the proposed path changes and behaviors to reconcile before implementation.

```bash
npm ci
npm run dev       # http://localhost:4321
npm test
npm run check     # astro check and tsc
npm run lint
```

`dev`, `build` and `test` first run `specs`, which installs `forms/`, deletes `dist/` and
compiles every spec. Nothing recompiles after that: run `npm --prefix .. run compile`
after changing a spec, and reload the page after changing a plan or a `parity/diffs/` file.

## Where things live

| Path                 | What it holds                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `src/content/forms/` | One plan per form, validated by `src/content.config.ts`.                                       |
| `src/pages/forms/`   | The catalog (`index.astro`) and each form's page (`[slug].astro`).                             |
| `src/components/`    | The field tree and comparison sheet (`forms/comparison/`), and the preview (`forms/preview/`). |
| `src/stores/`        | Filter and comparison state, in nanostores.                                                    |
| `src/lib/`           | Plan and comparison logic, with a `*.test.ts` beside each module.                              |

## Previews

CI builds the site for every pull request that touches `forms/` and deploys it to the
`sgg-form-library` Cloudflare Worker, aliased to the PR. See
[`ci-form-library-preview.yml`](../../.github/workflows/ci-form-library-preview.yml).
