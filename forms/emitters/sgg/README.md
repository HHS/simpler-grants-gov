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
- **`@Sgg.sync(#{ xml: "mapping" })`** installs its XML mapping as `xml_mapping.json`, the
  format shaped like the XML, instead of `xml_transform.json`. The default is
  `xml: "transform"`, which is an error for a form whose transform rules would leave out
  part of its XSD: a wrapper with no field of its own, or an attachment below the root.
- **`@Sgg.sync(#{ instructions: "<uuid>" })`** points the form at its instructions: the
  `form_instruction_id` of a form instruction record, uploaded to each environment with
  the API's `update-form-instruction` task (`api/src/task/forms/README.md`). Give each form
  its own record, even one that shares another form's PDF.
- **`@Sgg.sync(#{ sggVersion: "1.1" })`** sets the form's version in Simpler Grants, its
  `sgg_version`. It defaults to `1.0`. Sync installs each version in its own folder, so
  `1.1` is written to `1/1/` beside `1/0/`.
- **`@Sgg.sync(#{ formType: "KeyContacts" })`** sets the form's `form_type`, a value of
  the API's `FormType` enum. Leave it out for a form that has no `FormType` yet.

A form with `@Sgg.sync` must also have `@GrantsGov.form` (from
[`form-library-xml`](../xml/)), the identity the API registers it under.

**`@Sgg.attachment`** marks a question whose answer is the id of one of the application's
uploads, as `Questions.Types.Attachment` is. Every form that asks one, or a scalar that
extends it, gets a rule schema that has the API check each id still belongs to the
application.

## Output

Sync installs each form into the API as a `form.json` with four schema files beside it.
Each comes from one emitter's output:

| API file                                   | Contents                                                           | Emitted by         | Emitted as                                                           |
| ------------------------------------------ | ------------------------------------------------------------------ | ------------------ | -------------------------------------------------------------------- |
| `json_schema.json`                         | The answers the form collects                                      | `simpler-forms`    | `dist/canonical/forms/<id>/schema.json`                              |
| `ui_schema.json`                           | How the form is laid out                                           | `simpler-forms`    | `dist/canonical/forms/<id>/ui.json`                                  |
| `xml_transform.json` or `xml_mapping.json` | How the answers are written as Grants.gov XML                      | `form-library-xml` | `dist/canonical/forms/<id>/xml-transform.json` or `xml-mapping.json` |
| `rule_schema.json`                         | What the API checks or fills in: attachments, population, formulas | this emitter       | `dist/sgg/forms/<id>/rule-schema.json`, when the form has any rules  |
| `form.json`                                | Whether and how to install the form, and its Grants.gov identity   | this emitter       | `dist/sgg/forms/<id>/sgg.json`                                       |

`sgg.json` contains the [`@Sgg.sync`](#decorators) options and the `@GrantsGov.form` identity.
The rule schema's entries are described under [Population](#population) and
[Formulas](#formulas). Set `property-casing` to match the `simpler-forms`
emitter's, so the rule schema's keys name the schema's properties.

`scripts/sync.mjs` reads these files and copies them into the form's directory in the API.

## Development

```bash
npm run build -w emitters/sgg          # also run by npm run compile
npm run check:types -w emitters/sgg
```

## Population

`@Sgg.prePopulate(Sgg.PrePopulationRule.agencyName)` and
`@Sgg.postPopulate(Sgg.PostPopulationRule.currentDate)` say which rule fills an answer.
They emit `gg_pre_population` and `gg_post_population` in the rule schema.
Population runs only in the API.
Set read-only and requiredness separately. A field can have one population rule.

## Formulas

simpler-forms' `@Formula` decorators calculate an answer from others. This emitter writes
each one as a `gg_pre_population` rule, so the API fills those answers in before it
validates.

| Formula                               | API rule                                                |
| ------------------------------------- | ------------------------------------------------------- |
| `@Formula.sum(sources...)`            | `sum_monetary` with `fields`                            |
| `@Formula.subtract(from, amounts...)` | `subtract_monetary`, `from` minus the rest              |
| `@Formula.percentOf(amount, percent)` | `multiply_by_percentage` with `amount` and `percentage` |

simpler-forms checks each formula's paths, that a block reads blocks, and that formulas
don't read each other in a loop. A source is a field, or a tuple of fields where each is a
field of the one before it, and a list in the path means every item:

```tsp
model CostRow {
  total?: Money;
  nonAllowable?: Money;

  @Formula.subtract(CostRow.total, CostRow.nonAllowable)
  allowable?: Money;
}

model Budget {
  lines?: CostRow[];

  // Each field of the block totals the same field in every line.
  @Formula.sum(Budget.lines)
  lineTotals?: CostRow;

  @Formula.sum([Budget.lines, CostRow.allowable])
  allowableTotal?: Money;
}
```

```json
"lineTotals": {
  "total": { "gg_pre_population": { "rule": "sum_monetary", "fields": ["lines[*].total"] } },
  "allowable": { "gg_pre_population": { "rule": "subtract_monetary", "fields": ["@THIS.total", "@THIS.nonAllowable"], "order": 2 } }
}
```

- **Paths:** A source's first field is on the formula's own model, read as
  `@THIS.<path>` (or by its plain path at the form's root), so each copy of the model reads
  its own data. Or it's on a model that contains this one, read by absolute path from the
  nearest place that model has.
- **Blocks:** When the answer is a block, `sum` and `subtract` work field by field, through
  nested blocks. They skip the fields the block calculates itself, which are then worked
  out from the totals. The sources are read by absolute path, so the block can't be inside
  a list.
- **Order:** A formula that reads another formula has an `order` one higher than the
  highest order it reads, so the API writes a total of totals last.
- **Types:** Formulas calculate money: fields whose type has
  `@Meta.tag(Catalogue.Tag.money)`. `percentOf` takes a whole-number percentage.
- **Errors:** A shape the API has no rule for is `sgg/unsupported-formula`, e.g. a sum of
  counts, a percentage of every item of a list, or a block with a field that isn't money. A
  formula on an answer with `@Sgg.prePopulate` or `@Sgg.postPopulate` is
  `sgg/conflicting-formula`.
