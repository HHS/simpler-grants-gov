# Form parity

Whether each form's artifacts agree: the form plan (`site/src/content/forms/<slug>.json`),
the Grants.gov DAT and XSD it cites, the JSON Schema and UI schema compiled from its
TypeSpec (`dist/canonical/forms/<spec_id>/`), and the XML transform rules emitted from its
`@Mapping` links (`xml-transform.json`, in the same directory). It is static analysis: every artifact is
flattened to `{path: field}` and the maps are compared. Nothing is validated or rendered.

## Running it

```bash
npm run compile        # the compiled artifacts under test
npm run test:parity    # fetches any missing sources first, then runs vitest
npm run check:parity   # type-checks the suite
```

## Sources

DATs and XSDs are not committed. `npm run parity:fetch` downloads them from each registered
plan's `dat_url` and `xsd_url`, and every schema those XSDs import, into `.cache/sources/`
(ignored by git). Tests read only that cache and never touch the network.

`sources/sources.lock.json` records each file's SHA-256. A cached file that matches is not
downloaded again, so a warm cache makes the fetch a no-op; CI restores the cache keyed on
the lockfile. If Grants.gov revises a file, the fetch fails rather than silently changing
what the suite compares. Review the revision, then accept it with
`npm run parity:fetch -- --update` and commit the new lockfile.

## What is checked

Each comparison names a subject and runs some of the same seven checks against it:
_has no missing fields_, _has no extra fields_, _matches field order_, _matches field
labels_, _matches field occurrences_, _matches field constraints_ and _matches help text_. Requirements checks ask
whether the plan says what Grants.gov says, so the plan is the subject. Implementation
checks ask whether what we built does what the plan says, so the artifact is the subject.

| Group          | Comparison                  | Subject           | Checks                                                        | Matched by              |
| -------------- | --------------------------- | ----------------- | ------------------------------------------------------------- | ----------------------- |
| Requirements   | plan vs DAT                 | plan              | missing, extra, order, labels, occurrences, constraints, help | `dat_field`             |
| Requirements   | plan vs XSD                 | plan              | missing, extra, occurrences, constraints                      | `xml_path`              |
| Implementation | plan vs Grants.gov identity | `@GrantsGov.form` | OMB number, OMB expiration date                               | the form                |
| Implementation | plan vs JSON schema         | JSON schema       | missing, extra, occurrences, constraints                      | `json_path`             |
| Implementation | plan vs UI schema           | UI schema         | missing, extra, order, labels, help                           | `json_path`             |
| Implementation | plan vs rules schema        | rules schema      | not yet emitted (`it.todo`)                                   |                         |
| Implementation | plan vs XML mapping         | XML mapping       | missing, extra                                                | `json_path -> xml_path` |
| XML            | XML mapping vs JSON schema  | XML mapping       | missing, extra                                                | `json_path`             |
| XML            | XML mapping vs XSD          | XML mapping       | missing, extra, order                                         | `xml_path`              |
| XML            | JSON schema vs XSD          | JSON schema       | occurrences, constraints (the schema may be stricter)         | the plan's link         |

Labels and help text are compared ignoring whitespace and case, so a DAT's "Enter the
Middle Name." matches the question bank's "Enter the middle name.".

The XML mapping comparisons run only for a form with emitted rules, i.e. one whose XSD
TypeSpec model names it with `@Mapping.from` in the `grantsGovXml` mapping. Plan vs XML mapping matches each field by its
JSON path and element path together, so a field the mapping writes to a different element
than the plan says shows as both missing and extra. Order is checked against the XSD
because the API writes elements in the order of the rules, and the XSD is a sequence.

`xsdModels.test.ts` checks the XSD TypeSpec models (each form's `xsd.tsp`, and the shared ones
in `specs/xsd/`), the XML mapping target
the rules are read off, against the XSDs they model: missing and extra elements, order,
requiredness, occurrences and namespaces. It compiles the specs in memory and finds each
model by its `@GrantsGov.xsd` URL, so it needs no plan, and it checks a model no form links
to yet. Its flattener reads a compiled program, so only that test imports it; the site
bundles `harness/index.ts`.

Suite checks then confirm the results can be trusted for each form: the plan's text is
readable, the walked JSON schema agrees with the emitter's `index.json`, and every
recorded difference still exists.

Constraints are requiredness plus the keywords each comparison reads (`SPECS` in
`harness/index.ts`). Requiredness is always from the form's root, so a field inside an
optional section is optional. A plan's `Conditional (...)` counts as optional.

The DAT is compared on `maxLength` for text and `minimum`/`maximum` for numeric values. For text, its minimum characters are 0 for optional fields and 1
for required ones, so that text minimum restates requiredness; the XSD is the authority on
`minLength`. A DAT list shown as a popup is a fixed code list, so its "max chars" is not a
length rule. An exact length is stated in a plan as `minLength 12, maxLength 12`.

The DAT prints `*` before a required field's label. Labels compared with the DAT keep it,
and the plan's label gets one wherever the plan says the field is required, so a label only
differs on the asterisk where the DAT and the plan disagree about requiredness (a DAT `*`
on a field the plan makes conditional, for example).

Occurrences are how many times a field can appear in one form: `max_items` on a plan
node (a field's own, else its nearest repeating section's; 1 by default), the DAT's Maximum
Occurrences, the product of `maxOccurs` above an XSD element, and the product of `maxItems`
above a schema field. Only the maximum is compared: the DAT's minimum occurrences restates
requiredness, like its minimum characters.

Everything else is compared for equality, except JSON schema vs XSD: there the compiled
schema must accept nothing the XSD rejects, but may be stricter.

## Adding a form

Write `diffs/<form>.ts` exporting a `FormDiff` whose `slug` is the plan's, and add it to
`DIFFS` in `diffs/index.ts`. The plan needs `dat_url`, `xsd_url`, and fields with
`dat_field`, `json_path` and `xml_path`. A plan without a `spec_id` gets the requirements
checks only; the rest are skipped until the form is compiled. A test fails if a plan with a
`spec_id` is not registered.

## When a check fails

Each failure lists every difference of one kind. For each, either fix the artifact that is
wrong, or record the difference in the form's `diffs/` file. Every entry has a `category`
and a `reason`:

| `category`    | Shown as               | Meaning                                               |
| ------------- | ---------------------- | ----------------------------------------------------- |
| `upstream`    | Upstream discrepancy   | The Grants.gov DAT and XSD disagree.                  |
| `intentional` | Intentional difference | Simpler Grants intentionally differs from Grants.gov. |
| `gap`         | Known gap              | A known gap awaiting a fix.                           |

`renamed` maps a plan path to the artifact's path (`to`) where the two name one field
differently.

A difference in a value (a rule, a label or help text) is recorded with the values it was
accepted at, so it cannot drift unnoticed. Use `null` for a side that states nothing:

```ts
dat: {
  differingRules: {
    "7-01/maxLength": {
      plan: 6,
      source: 4,
      category: "upstream",
      reason: "The DAT says 4; the XSD's type allows 6.",
    },
  },
},
```

If either value later changes, the difference is reported again under its own check, with
what was recorded (`plan 5, source 6; recorded as plan 4, source 6`). A field that is absent
or out of order is recorded by path alone.

A recorded difference that stops being real fails _recorded differences still exist_, so
the record cannot rot.

Every recorded difference is shown on the form's page in the form library, in the field
tree's comparison sheet (see `comparison.ts`). Context that cannot be checked goes in the
plan's `notes` instead, which the page shows separately.

## Layout

Read top-down; each layer only imports the ones below it. Unit tests sit beside the module
they cover.

```
forms.test.ts       every check, per registered form -- start here
harness.test.ts     each check, on hand-built fields: does it report what its name says?
diffs/              one record of known differences per form
comparison.ts       each plan field against every source, as the form library's field tree shows it
sources/
  fetch.ts            the parity:fetch CLI
  sources.lock.json   SHA-256 of every cached Grants.gov file
harness/
  index.ts            checkForm() and SPECS: what each comparison checks
  load.ts             every disk read: plans, compiled artifacts, cached sources
  flatten/            one pure flattener per artifact, each with its own *.test.ts
  compare.ts          comparePair(): the six checks, with recorded differences applied
  model.ts            paths, fields, discrepancies, recorded differences (+ model.test.ts)
```

### Decimal precision

`multipleOf` is compared with numeric bounds and displayed on the range row. Plans can
state `minimum 0, maximum 9999999999.99, multipleOf 0.01`; XSD `fractionDigits 2`
provides the matching numeric step. Containment requires the implementation's step to
be an exact decimal multiple of the source step: `0.1` is stricter than `0.01`, while
`0.03` does not satisfy `0.02`.

JSON Schema precision is read for explicit numeric types. A decimal string constrained
by a pattern is a different representation; a numeric `multipleOf` keyword does not
constrain it. Such a path still reports missing numeric precision, rather than claiming
string-pattern equivalence. `totalDigits` and `whiteSpace` remain outside this comparison;
`fractionDigits` does not establish full XSD equivalence. DAT numeric maximum values are
not character lengths; numeric DAT ranges remain unchecked by the DAT comparison.

The plan schema is importable from `site/src/lib/formPlanSchema.ts` without Astro. The
site's content collection uses that same schema. External orchestration should import
the maintained schema and parity functions rather than duplicate them.

## Finite DAT cells and older XSDs

A repeated answer can be printed as several fixed DAT cells. Keep the one semantic array
and bind each physical cell explicitly on its field:

```json
{
  "json_path": "activities[].amount",
  "source_bindings": {
    "at": "activities",
    "dat": [
      { "kind": "slot", "path": "A-1", "index": 0 },
      { "kind": "slot", "path": "A-2", "index": 1 }
    ]
  }
}
```

Its containing section declares `max_items: 2`. Slots must cover exactly that one finite
array, with unique coordinates/indices and no simultaneous `dat_field` shorthand. Missing,
overlapping, nested or unbounded slot mappings fail. DAT occurrences are one per physical
cell; the XSD and proposed JSON still describe the repeated answer. The comparison view
aggregates every bound cell and preserves the most severe finding rather than choosing one.
Legacy single-coordinate fields retain their behavior.

For an older XSD with multiple global elements, `xsd_root` explicitly selects the form root;
there is no guessed root. Named root types, referenced model groups and global attributes
are resolved by the same XSD reader. Fixed attributes remain constants, not answers.
`parity:fetch` follows both `xs:` and `xsd:` import/include declarations.

SF-424A is the proving plan. Its73 semantic fields map all163 DAT cells. Its labels and
activity-first Section B order are proposals with individual source values/reasons in the
difference register. Wire metadata, totalDigits, formula execution, submission defaults and
human approval remain separate obligations; a green static comparison does not certify them.

Numeric DAT types, including `DECIMAL(n)`, expose signed value bounds rather than character
lengths. Empty minima stay unstated; non-numeric bounds refuse instead of becoming NaN.
SF-424A preserves the DAT's narrower signed bounds and records their difference from the
XSD's precision-only type at literal values. Rounding and arithmetic are still unexecuted.
