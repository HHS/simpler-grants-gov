# Form parity

Checks that a form generated from a SimplerForms specification is equivalent to the
hand-written form it mirrors.

- [Types of checks](#types-of-checks)
  - [Functional parity](#functional-parity)
    - [Field validation](#field-validation)
    - [Field text](#field-text)
    - [Field order](#field-order)
    - [Recorded differences](#recorded-differences)
- [Creating and using checks](#creating-and-using-checks)
  - [Adding a form](#adding-a-form)
  - [Running checks](#running-checks)
  - [Handling failed checks](#handling-failed-checks)

## Types of checks

### Functional parity

`json_schema/test_forms.py` compares each generated form with the hand-written form it
mirrors. Both forms' JSON Schemas are flattened into fields, each with a path, a required
status and validation rules (`json_schema/harness/flatten_schema.py`), and both UI schemas
into an ordered list of field paths (`json_schema/harness/flatten_ui.py`). Fields at the
same path match, unless the form's `FormDiff` maps them to different paths.

Each difference a check finds fails the test, unless the form's `FormDiff` records it.

| Group | Check | Test | Recorded in |
| --- | --- | --- | --- |
| Field validation | Missing fields | `test_generated_form_not_missing_handwritten_fields` | `absent_from_definition` |
| Field validation | Extra fields | `test_generated_form_does_not_add_extra_fields` | `absent_from_source` |
| Field validation | Requiredness | `test_generated_form_requires_the_same_fields` | `differing_rules` (`path/required`) |
| Field validation | Validation rules | `test_generated_form_accepts_the_same_values` | `differing_rules` (`path/<keyword>`) |
| Field text | Titles and descriptions | `test_generated_form_words_fields_the_same` | `differing_text` |
| Field order | Relative order | `test_generated_form_orders_fields_the_same` | `out_of_order` |
| Recorded differences | Stale entries | `test_recorded_differences_are_not_stale` | n/a |

The checks themselves live in `json_schema/harness/compare/`, one module per group. Each
harness module has its tests beside it, run over small hand-built inputs.

#### Field validation

Does each field in both forms have a matching field in the other, and are matching fields
validated against the same constraints? Requiredness and every validation keyword
(`type`, `enum`, `maxLength`, `pattern`, …) are compared separately, so a failure names
the field and the keyword that differs. A keyword set on only one form counts as a
difference.

#### Field text

Do matching fields, lists and groups have the same title and description? Case and
whitespace are ignored.

#### Field order

Do matching fields appear in the same relative order? Sections and groups are ignored,
so grouping the same fields differently isn't a difference. Only the fewest fields that
would need to move are reported, each located by the fields on either side of it.

#### Recorded differences

Does every difference recorded in the form's `FormDiff` still exist? An entry that names a
field neither form has, or a difference that's been fixed, fails.

## Creating and using checks

### Adding a form

1. Write `json_schema/diffs/<form>.py` with a `FormDiff` naming the generated and
   hand-written form modules.
2. Add it to `DIFFS` in `json_schema/test_forms.py`.

The form then runs through every check. While `DIFFS` is empty, the form checks are
collected and skipped.

### Running checks

```bash
# All parity checks
make test args="tests/src/form_schema/parity"

# One form
make test args="tests/src/form_schema/parity -k key_contacts_generated"
```

Running natively rather than in the container is much faster. It needs the environment
`make init` writes to `override.env`, which pytest doesn't read on its own:

```bash
export PY_RUN_APPROACH=local
set -a && . override.env && set +a
export DB_HOST=localhost SEARCH_ENDPOINT=localhost
uv run pytest tests/src/form_schema/parity
```

### Handling failed checks

Fix the generated form unless the difference is intended or the hand-written form is the
one that's wrong. In those cases, record the difference in the form's `FormDiff` with the
reason:

- **Field validation:** a field only one form has goes in `absent_from_source` (generated
  only) or `absent_from_definition` (hand-written only). A requiredness or rule
  difference goes in `differing_rules`, keyed `"path/required"` or `"path/<keyword>"`,
  with a citation naming the Grants.gov XSD, type and facet that shows which form is
  wrong. A field the two forms store at different paths goes in `mapped`.
- **Field text:** a wording difference goes in `differing_text`, keyed `"path/title"` or
  `"path/description"`.
- **Field order:** an order difference goes in `out_of_order`, keyed by the generated
  path.

An entry that stops describing a real difference fails the recorded differences check,
so remove it once the difference is fixed.

## The XML mapping checks

`xml/test_forms.py` holds each form's XML transform rules against the Grants.gov XSD
they target, hand-written forms included. `RecursiveXMLTransformer` walks the rules,
not the answers, so a field with no rule never reaches the submission -- and since most
Grants.gov elements are `minOccurs="0"`, the document still validates.

The rules, the XSD under `src/services/xml_generation/xsds/` and the form's own JSON
Schema are read into paths and held against the record in `xml/diffs/`:

- every target names an element the XSD declares
- every element the XSD requires has a source
- siblings are emitted in `xs:sequence` order
- every form field reaches an element, and every rule reads a field the form has
- the form offers no enum member, and accepts no length or range, the element cannot
  carry
- a field whose JSON type differs from its element's declares the `value_transform` that
  converts it
- every entry in the record still describes a real difference

The checks against the XSD alone have no register: an undeclared target or an unsourced
required element fails with no way to record it. A mapping that builds its structure at
run time rather than declaring it, as SF-424A's does, is listed in `unreadable` and
skipped by the structural checks.

`xml/test_harness.py` runs the comparisons over small hand-built inputs.

### Adding a form

Write `xml/diffs/<form>.py` with a `FormDiff` naming the package under
`src.form_schema.forms`, and add it to `DIFFS` in `xml/test_forms.py`.

### When a check fails

A field no rule reads goes in `absent_from_definition`, a rule reading a field the form
lacks in `absent_from_source`, and a form looser than its element in `differing_rules`,
keyed `"element path/keyword"`, citing the XSD type and facet and saying whether an
applicant can reach the value. As above, these are defects to fix, and an entry the
comparison no longer finds with the record set aside is stale.
