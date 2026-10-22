# form-library-xml

Emits Grants.gov XML transform rules, the `xml_transform.json` the API's XML generation
reads, from each form's `@Mapping.from` links to its XSD model.

## Decorators

- **`@GrantsGov.xsd(url)`** on an XSD model's root: the XSD it models.
- **`@GrantsGov.form(#{ shortFormName, formVersion, ... })`** on a form: what Grants.gov
  lists and versions it as.

The XSD models themselves use `@typespec/xml` (`@Xml.ns`, `@Xml.name`, ...) and live in
[`specs/xsd/`](../../specs/xsd/) and each form's `xsd.tsp`.

## Output

For every form linked in a configured mapping target (`mapping-targets` in
`tspconfig.yaml`), beside the `simpler-forms` artifacts in `dist/canonical/`:

```
forms/<id>/xml-transform.json
```

## Development

```bash
npm run build -w emitters/xml
npm run test:emitters                  # test/xml-transform.test.ts, against test/fixtures/
```
