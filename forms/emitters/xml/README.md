# form-library-xml

Emits Grants.gov XML transform rules, the `xml_transform.json` the API's XML generation
reads, from each form's `@Mapping.from` links to its XSD model.

## Decorators

- **`@GrantsGov.xsd(url)`** on an XSD model's root: the XSD it models.
- **`@GrantsGov.form(#{ shortFormName, formVersion, ... })`** on a form: what Grants.gov
  lists and versions it as.

The XSD models themselves use `@typespec/xml` (`@Xml.ns`, `@Xml.name`, ...) and live in
[`specs/xsd/`](../../specs/xsd/) and each form's `xsd.tsp`.

On the XSD models, simpler-forms' mapping decorators each become one function of the XML
mapping (`xml-mapping.json`):

| On an XSD model's property                            | In the XML mapping         |
| ----------------------------------------------------- | -------------------------- |
| `@Mapping.from(xml, Mapping.Item<F.types, 0>)`        | `$field: "types[0]"`       |
| `@Mapping.from(xml, Mapping.Slice<F.sites, 1>)`       | `$each` over `"sites[1:]"` |
| `@Mapping.transform(T.truncate, #{ max_length: 60 })` | `$transform`               |
| `@Mapping.match(#{ … }, default?)`                    | `$match`                   |
| `@Mapping.when(F.kind, Operator.equals, "Revision")`  | `$when`                    |
| `@Mapping.required`                                   | `$required`                |

An optional element of its own with a `@Mapping.required` element inside is written only
while the field it's filled from is answered.

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
