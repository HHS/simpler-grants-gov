"""Checks that compare a generated form with the hand-written form it mirrors.

Each module covers one group of checks:

    field_validation   missing and extra fields, requiredness, and validation rules
    field_text         titles and descriptions
    field_order        the relative order fields are shown in

Every check takes the form's `FormDiff` and both forms flattened, and returns the
`Discrepancy` objects the `FormDiff` doesn't account for. `match.match_fields` pairs up
the fields the checks compare.
"""
