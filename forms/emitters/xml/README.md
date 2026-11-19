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

`@Mapping.when` works on any element: a value, a list, or a group of elements with no
`@Mapping.from` of its own, like the SF-LLL's `MaterialChangeSupplement`, which is written,
attributes and all, only for a material change:

```typespec
@Mapping.when(SFLLL.reportType, Operator.equals, "MaterialChange")
@name("MaterialChangeSupplement") supplement?: MaterialChangeSupplement;
```

`@Mapping.required` writes an element even when its field is empty, e.g. `<Total/>`.
Inside an optional element, that would write the optional element for an answer the
applicant never gave. So an optional element that contains a `@Mapping.required` element is
written only when the field it's filled from is answered. For example, a budget with one
year per item in `periods`:

```typespec
@Mapping.from(xml, Mapping.Item<F.periods, 0>) @name("BudgetYear1") year1?: BudgetYear;
@Mapping.from(xml, Mapping.Item<F.periods, 1>) @name("BudgetYear2") year2?: BudgetYear;

model BudgetYear {
  @Mapping.from(xml, F.Period.total) @Mapping.required @name("Total") total?: string;
}
```

An applicant who enters one year:

```json
{ "periods": [{ "total": "100.00" }] }
```

the XML has `BudgetYear1`, and no `BudgetYear2`:

```xml
<BudgetYear1><Total>100.00</Total></BudgetYear1>
```

Without this rule, the XML would also have `<BudgetYear2><Total/></BudgetYear2>`.

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
