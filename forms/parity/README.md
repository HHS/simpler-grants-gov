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

## Maintenance CLI prototype

From `forms/`, run `npm run --silent form -- findings` to list registered **plan slugs**,
then inspect one form:

```bash
npm run --silent form -- findings key-contacts
npm run --silent form -- findings key-contacts --comparison dat --format json
npm run --silent form -- findings key-contacts --include-recorded --format json
```

This command projects `checkForm` results. It does not run a second checker, retrieve
sources, compile forms, or parse test output. Fetch and compile explicitly using the
commands above. Default output is a compact TOON table with readable findings and an
accept-command template. JSON output preserves complete typed values and prior entries.
Use `--full` for untruncated human summaries. An empty result explicitly reports zero;
`notRun` identifies comparisons that were unavailable. This is static parity evidence,
not runtime verification or production approval.

Record one reviewed difference using its exact comparison, `recordAs.register`,
`recordAs.key`, and fingerprint from the finding:

```bash
npm run --silent form -- accept key-contacts \
  --comparison dat --register differingLabels --key 7-10 \
  --expect '<fingerprint>' --category intentional \
  --reason 'The shared address question uses the reviewed standard label.' --dry-run
```

Remove `--dry-run` to record it. The preview shows the destination, exact record and
text edits. A dry run may create a temporary candidate module to validate its actual
export, then removes it; authoritative files remain unchanged. The CLI pins the exact
normalized values supplied by the maintained evaluator, including numbers, arrays and
null. It never infers values from printed descriptions. Nonrecordable suite issues and
stale entries cannot be accepted; stale removal is a separate manual task for now.

A fingerprint binds the compared values (or nonvalue finding detail), status and current
prior disposition. If any of those change, obtain a fresh finding before writing. Updating
a prior entry requires `--replace`. An exact desired direct record is an idempotent no-op,
even with its original fingerprint; that shortcut never writes. Existing wholesale
`wording` policy is retained and never created or broadened by this command. Literal
`--reason` text is supported initially; existing shared helpers remain untouched outside
the selected edit. Named reason references are deferred rather than introducing an import
rewriter.

TypeScript remains the **one acceptance store**. The writer uses the existing TypeScript
parser and changes only a supported expression span. It checks the candidate's actual
`DIFF` export against the expected one-entry change, rereads the source before replacing
it, and uses a same-directory temporary file and atomic rename. This is an optimistic
source-change guard, not a multi-file transaction or operating-system compare-and-swap.

The safe subset is deliberate: the exported DIFF and selected comparison/register must
be literal objects without duplicate, computed, shorthand or spread properties on their
ancestor path. Existing entry initializers such as `standardLabel(...)` can be replaced
without rewriting neighbors. Computed dictionaries, helper identifiers and roots with
spreads are refused with an actionable manual fallback. In the current five-form registry,
Key Contacts supports its literal registers and EPA supports insertion into missing literal
registers, while EPA's existing computed label/help dictionaries and the three R&R-family
spread roots require manual edits. `findings` still reads all five forms. The special object-literal `__proto__` setter key is also refused rather than reporting
a successful write that creates no own dictionary entry. No unsupported write silently
succeeds.

A local proof changed the shared Address label from `Street1` to `Street 1`, explicitly
adopted it in all five plans, and compiled the actual outputs. Key Contacts' CLI record
matched the manual one-entry `FormDiff` reference; dry-run, write, exact retry and stale
expectation refusal behaved as documented. EPA's computed DAT labels were refused,
while a separate help difference could be recorded in its missing literal UI register
without changing the existing DAT or XML gaps. The exercise restored its source inputs
afterward; it demonstrates the bounded workflow, not a measured human time saving.

This prototype lives under `parity/cli/` because it adapts that evaluator and storage.
A full JSON migration was considered: the five executable records currently share reasons
and compute repeated groups. Migrating them would expand roughly 893 source lines to
1,162 JSON lines even with named reason references, before adding a loader and preserving
context comments. A JSON overlay would split acceptance ownership. Neither is needed to
prove the two initial commands. Writer refusals and real usage can inform a later storage
choice.

Designers/content reviewers can inspect findings and make an explicit category/reason
decision without understanding the diff-file syntax. Recording `gap` preserves it as a
known gap; it does not implement a fix or confer policy authority. The existing form-library
site remains the visual review surface. This prototype adds no browser write API, login,
comment service, agent hooks or separate hosted tool. Future site controls can call the same
maintenance operation after its write/authentication model is designed.

`prune`, `adopt-wording`, `docs:check` and `docs:update` remain deferred. They require their
own exact write boundaries and review decisions; accepting a difference must not silently
change a plan, question bank, tutorial or source lockfile.

Commands are noninteractive. Exit 0 means successful inspection/write/no-op, 1 means an
execution/conflict/unsupported-write error, and 2 means invalid arguments. Unknown flags
fail before artifact evaluation. `--help` is available for each command;
`node parity/cli/index.ts --version` prints the prototype version without loading the
checker/compiler. Use the `--silent` npm wrapper, or invoke that Node entry directly, when
consuming structured stdout.
