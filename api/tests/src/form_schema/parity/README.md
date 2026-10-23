# Form parity

Checks that a form generated from a SimplerForms specification is equivalent to the
hand-written form it mirrors, and that a form's XML mapping produces XML that matches the
Grants.gov XSD.

- [Types of checks](#types-of-checks)
  - [Functional parity](#functional-parity)
    - [Field validation](#field-validation)
    - [Field text](#field-text)
    - [Field order](#field-order)
    - [Recorded differences](#recorded-differences)
  - [XML mapping parity](#xml-mapping-parity)
    - [Mapping vs XSD](#mapping-vs-xsd)
    - [Mapping vs form schema](#mapping-vs-form-schema)
    - [Form schema vs XSD](#form-schema-vs-xsd)
    - [Recorded differences](#recorded-differences-1)
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

### XML mapping parity

`xml/test_forms.py` checks each form's XML mapping (`json_to_xml_schema`, or
`FORM_XML_TRANSFORM_RULES` on a hand-written form) against the form's JSON Schema and the
Grants.gov XSD it targets, vendored under `src/services/xml_generation/xsds/`. The XML is
built by walking the mapping's rules, not the applicant's answers, so a field no rule
reads is left out of the XML. Most Grants.gov elements are optional, so the XML still
validates and nothing else catches it.

`xml/harness/flatten_form.py` reads all three into one `FlatForm`: the elements
the mapping produces and the fields that fill them (`flatten_transform.py`), the elements
the XSD declares (`flatten_xsd.py`), and the form's fields (`flatten_schema.inputs()`).

| Group | Check | Test | Recorded in |
| --- | --- | --- | --- |
| Mapping vs XSD | Undeclared elements | `test_xml_mapping_does_not_emit_undeclared_elements` | can't be recorded |
| Mapping vs XSD | Required elements | `test_xml_mapping_not_missing_required_elements` | can't be recorded |
| Mapping vs XSD | Element order | `test_xml_mapping_follows_xsd_element_order` | can't be recorded |
| Mapping vs form schema | Unmapped fields | `test_no_form_field_is_missing_from_xml_mapping` | `unmapped_fields` |
| Mapping vs form schema | Unknown fields | `test_xml_mapping_does_not_read_unknown_form_fields` | `unknown_sources` |
| Form schema vs XSD | Enum values | `test_form_does_not_offer_values_outside_xsd_enums` | `differing_rules` (`path/enum`) |
| Form schema vs XSD | Lengths and ranges | `test_form_does_not_accept_values_outside_xsd_bounds` | `differing_rules` (`path/<keyword>`) |
| Form schema vs XSD | Types | `test_form_field_types_match_xsd_element_types` | `differing_rules` (`path/type`) |
| Recorded differences | Unchecked rules | `test_unchecked_rules_are_recorded` | `unchecked_rules` |
| Recorded differences | Stale entries | `test_recorded_differences_are_not_stale` | n/a |

The checks live in `xml/harness/compare/`, one module per group, with their tests beside
them.

#### Mapping vs XSD

Does the mapping produce only elements the XSD declares, every element it requires, and
each parent's children in the XSD's order? The XML is written in mapping order, so the
order of the rules is what keeps it valid. Elements under an attachment are built from the
uploaded file, so they're left out.

#### Mapping vs form schema

Does the mapping read every form field, and only fields the form has? A rule that reads a
missing field still produces an element, so the XSD checks don't catch it.

#### Form schema vs XSD

Does each field accept only values the element it fills can carry? A field stricter than
its element passes, and a field with no bound where its element has one is looser. Money
fields are strings, so their range is read from their pattern. A difference that the
rule's `value_transform` accounts for, such as `boolean_to_yes_no` for a boolean filling
a `YesNoDataType`, passes.

#### Recorded differences

Does the `FormDiff` list exactly the mapping rules the checks can't read, and does every
other difference it records still exist? A form with unchecked rules skips every other
check, so the unchecked rules check runs for every form.

## Creating and using checks

### Adding a form

- **Functional parity:** write `json_schema/diffs/<form>.py` with a `FormDiff` naming the
  generated and hand-written form modules, and add it to `DIFFS` in
  `json_schema/test_forms.py`. While `DIFFS` is empty, the form checks are collected and
  skipped.
- **XML mapping parity:** write `xml/diffs/<form>.py` with a `FormDiff` naming the form's
  module under `src.form_schema.forms`, and add it to `DIFFS` in `xml/test_forms.py`.

The form then runs through every check in that suite.

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

Fix the form unless the difference is intended, or the other side is the one that's
wrong. In those cases, record the difference in the form's `FormDiff` with the reason:

- **Field validation:** a field only one form has goes in `absent_from_source` (generated
  only) or `absent_from_definition` (hand-written only). A requiredness or rule
  difference goes in `differing_rules`, keyed `"path/required"` or `"path/<keyword>"`,
  with a citation naming the Grants.gov XSD, type and facet that shows which form is
  wrong. A field the two forms store at different paths goes in `mapped`.
- **Field text:** a wording difference goes in `differing_text`, keyed `"path/title"` or
  `"path/description"`.
- **Field order:** an order difference goes in `out_of_order`, keyed by the generated
  path.
- **Mapping vs XSD:** can't be recorded. Fix the mapping.
- **Mapping vs form schema:** a field no rule reads goes in `unmapped_fields`, and a field
  a rule reads that the form doesn't have goes in `unknown_sources`.
- **Form schema vs XSD:** a field looser than its element goes in `differing_rules`,
  keyed `"element path/keyword"`, saying whether it's a bug or intentional.
- **Unchecked rules:** a rule the checks can't read goes in `unchecked_rules`, with the
  reason.

An entry that stops describing a real difference fails the recorded differences check,
so remove it once the difference is fixed.
