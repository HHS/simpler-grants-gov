# Form parity

Whether a form generated from a SimplerForms specification is equivalent to the
hand-written form it mirrors.

## Running them

```bash
# Fast enough to belong on every commit.
make test args="tests/src/form_schema/parity"

# One form, when a failure needs chasing.
make test args="tests/src/form_schema/parity -k key_contacts_generated"
```

Running natively rather than in the container is much faster, and needs the environment
`make init` writes to `override.env`, which pytest does not read on its own:

```bash
export PY_RUN_APPROACH=local
set -a && . override.env && set +a
export DB_HOST=localhost SEARCH_ENDPOINT=localhost
uv run pytest tests/src/form_schema/parity
```

## What is checked

`json_schema/test_forms.py` holds each generated form against the hand-written form it
mirrors, with the record in `json_schema/diffs/`:

- every input on the hand-written form has a counterpart on the generated one, and the
  other way round
- corresponding inputs are equally required
- corresponding inputs are governed by the same validation rules
- corresponding inputs carry the same title and description, ignoring case and whitespace
- every entry in the record still describes a real difference

The first is the only check that can see a field one form has and the other lacks.
Neither schema sets `additionalProperties`, so an unexpected field validates cleanly on
both. Parity therefore cannot be established by running payloads through a validator.

The rule comparison reads a flattened schema, which is an approximation a validator never
has to make. In exchange it names every field and keyword that differs in one pass, where
a validator needs a payload that exercises each one.

`json_schema/test_harness.py` runs the same functions over small hand-built inputs, so
each rule is visible on its own.

## The property-based check, and why it is not here

A counterpart would generate payloads and require the API's own validator to reach the
same verdict against both schemas. It is not here for two reasons.

It finds nothing the rule comparison does not. And it misses the most common kind:
generated values land over *every* limit rather than between two, so a field capped at 60
on one side and 200 on the other rejects them on both and the difference stays invisible.
Catching that needs values drawn from each field's declared facets.

## Adding a form

A form contributes a record and nothing else -- no test code, no fixture, no seed. Write
`json_schema/diffs/<form>.py` with a `FormDiff` naming the two modules, add it to `DIFFS`
in `json_schema/test_forms.py`, and it inherits every check. Fields at the same path
correspond on their own; `renamed` pairs up the ones the two forms spell differently.

The record is deliberately hand-written: it is a claim about two forms that someone should
have to defend, and the checks then hold it to both schemas so it cannot be quietly tuned
until they pass. While `DIFFS` is empty the form checks collect nothing and are skipped.

## When a check fails

A rule difference where the official Grants.gov schema shows the *hand-written* form is
the one that is wrong goes in `differing_rules`, with a citation naming the XSD, the type
and the facet. That is a defect list for Simpler Grants, not permission for the difference
to exist -- and the stale-entries check fails if an entry stops naming a real input, so
the record cannot rot.

A wording difference the generated form means to keep goes in `differing_text`, keyed
`"path/title"` or `"path/description"`. An entry whose two texts come to agree is stale
too.

Anything else is ours to fix.
