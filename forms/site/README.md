# Form library site

An Astro site listing every form's plan and, for a form with a spec, its field tree,
its comparison with the DAT and XSD, and a preview of the compiled form.

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
