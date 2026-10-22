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

| Group          | Comparison                 | Subject      | Checks                                                        | Matched by              |
| -------------- | -------------------------- | ------------ | ------------------------------------------------------------- | ----------------------- |
| Requirements   | plan vs DAT                | plan         | missing, extra, order, labels, occurrences, constraints, help | `dat_field`             |
| Requirements   | plan vs XSD                | plan         | missing, extra, occurrences, constraints                      | `xml_path`              |
| Implementation | plan vs JSON schema        | JSON schema  | missing, extra, occurrences, constraints                      | `json_path`             |
| Implementation | plan vs UI schema          | UI schema    | missing, extra, order, labels, help                           | `json_path`             |
| Implementation | plan vs rules schema       | rules schema | not yet emitted (`it.todo`)                                   |                         |
| Implementation | plan vs XML mapping        | XML mapping  | missing, extra                                                | `json_path -> xml_path` |
| XML            | XML mapping vs JSON schema | XML mapping  | missing, extra                                                | `json_path`             |
| XML            | XML mapping vs XSD         | XML mapping  | missing, extra, order                                         | `xml_path`              |
| XML            | JSON schema vs XSD         | JSON schema  | occurrences, constraints (the schema may be stricter)         | the plan's link         |

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

The DAT is compared on `maxLength` only. Its minimum is 0 for every optional field and 1
for every required one, so it restates requiredness; the XSD is the authority on
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

Write `diffs/<form>.json` with the plan's `slug`, import it in `diffs/index.ts`, and add
its filename/data pair to `RECORDS`. The loader validates it and resolves named reasons into
the unchanged `FormDiff` evaluator contract. The plan needs `dat_url`, `xsd_url`, and fields with
`dat_field`, `json_path` and `xml_path`. A plan without a `spec_id` gets the requirements
checks only; the rest are skipped until the form is compiled. A test fails if a plan with a
`spec_id` is not registered.

## When a check fails

Each failure lists every difference of one kind. For each, either fix the artifact that is
wrong, or record the difference in the form's `diffs/` file. Every entry has a `category`
and a `reason`, either inline or through a `reasonRef` to `diffs/reasons.json`:

| `category`    | Shown as               | Meaning                                               |
| ------------- | ---------------------- | ----------------------------------------------------- |
| `upstream`    | Upstream discrepancy   | The Grants.gov DAT and XSD disagree.                  |
| `intentional` | Intentional difference | Simpler Grants intentionally differs from Grants.gov. |
| `gap`         | Known gap              | A known gap awaiting a fix.                           |

`renamed` maps a plan path to the artifact's path (`to`) where the two name one field
differently.

A difference in a value (a rule, a label or help text) is recorded with the values it was
accepted at, so it cannot drift unnoticed. Use `null` for a side that states nothing:

```json
{
  "dat": {
    "differingRules": {
      "7-01/maxLength": {
        "plan": 6,
        "source": 4,
        "category": "upstream",
        "reason": "The DAT says 4; the XSD's type allows 6."
      }
    }
  }
}
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

## Maintenance CLI prototype

From `forms/`, list registered plan slugs and inspect one form:

```bash
npm run --silent form -- findings
npm run --silent form -- findings key-contacts --comparison dat --format json
npm run --silent form -- findings key-contacts --include-recorded --format json
```

`checkForm` owns comparison and normalization. The CLI projects its typed results; it
neither parses test output nor runs another checker. Fetch and compile inputs explicitly.
Default output is a TOON table; `--format json` preserves complete values and prior decisions.
`--full` shows untruncated summaries. Zero counts and `notRun` distinguish a clean check
from an unavailable comparison. Static parity is not production approval.

Record one explicitly reviewed decision using its exact target and current fingerprint:

```bash
npm run --silent form -- accept key-contacts \
  --comparison dat --register differingLabels --key 7-10 \
  --expect '<fingerprint>' --category intentional \
  --reason 'The shared address question uses the reviewed standard label.' --dry-run
```

Remove `--dry-run` to write. The preview names the destination and shows the selected old
and proposed stored entries. Dry-run creates no temporary file. The checker supplies pin
values, including numbers, arrays and null; the caller chooses category and rationale.
Stale entries and suite issues cannot be accepted. `renamed` and the reserved `__proto__`
key are outside this command's scope.

Fingerprints bind observations, status and the current decision, including whether it is
a direct record or wholesale wording. Replacing a prior decision requires `--replace`.
If a direct record is already accepted by the checker and its category/reason are unchanged,
retry succeeds without writing, including whitespace-equivalent pins and reordered enum
arrays. This uses the checker's equivalence; the CLI has no second equality policy.
Wholesale wording never qualifies for that direct-record shortcut and is never broadened
by `accept`.

The five form JSON files are the sole per-form acceptance store. `reasons.json` owns named
category/reason definitions; entries either reference one or contain an explicit inline
decision. Existing matching references are retained, and new entries reuse an exact matching
named reason. Accept never changes a shared definition. Source comments remain as `notes`
that the loader excludes from the evaluator contract.

Registration owns each record and its destination; there is no directory scan or inferred
slug filename. Static JSON imports preserve the site's bundling and dev refresh behavior.
The writer rereads the selected file and shared reasons, rejects an evaluated-record mismatch,
checks that resolution changes only the selected entry, and verifies both files' bytes before
same-directory replacement. No TypeScript source is parsed, rewritten or executed to validate
a write. Atomic rename is an optimistic guard, not a multi-file transaction or OS compare-and-swap.

The data tradeoff is explicit: helper-generated repeated paths, notably the three attachment
registers, are expanded. Shared rationale stays named, but the old executable grouping is
not retained. The plan remains the owner of JSON/XML links. This candidate chooses predictable
writes across all five forms over a growing TypeScript editing subset; it adds no JSON overlay
or generic group-expression language.

The local trial wrote a selected decision in each registered form and compared the entire
resolved export with a manual one-entry reference. A real shared `Street1` to `Street 1`
change, with 11 explicitly manual plan adoptions, produced five new DAT findings; all five
were recorded, including EPA's four formerly computed entries. Retries and stale-token refusal
were exercised. All authored trial inputs were restored. This proves the workflow, not human
time savings or maintainer acceptance.

The CLI stays in `parity/cli/`; evaluator policy stays in `parity/harness/`; stored data,
resolution and registration stay in `parity/diffs/`. No site write API, new framework or agent
integration is introduced. `prune`, `adopt-wording`, `docs:check` and `docs:update` remain deferred.
The tutorial's storage examples are updated manually; automatic tutorial maintenance is separate.

Commands are noninteractive. Exit 0 means inspection/write/no-op, 1 means execution/conflict,
and 2 means invalid arguments. Unknown flags fail before evaluation. Each command supports
`--help`; `node parity/cli/index.ts --version` prints the prototype version without loading
the checker/compiler. Use npm's `--silent` wrapper for structured stdout.
