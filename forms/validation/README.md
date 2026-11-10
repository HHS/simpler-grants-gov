# Form answer validation

This suite exercises valid and invalid answers against emitted form schemas. Static source,
layout and mapping comparisons remain in `parity/`; rendered interaction and API rules are
separate checks. The harness reuses parity's schema loader and uses draft-2020-12 Ajv with
format validation. It does not simulate signing, API population or submission.

Run after `npm run compile`:

```sh
npx vitest run validation
npm run check:parity
```

Authored samples come from the form's `examples.tsp`. Keep maintained negative fixtures and
behavior tests here; screenshots and one-off investigation outputs belong on the PR.
