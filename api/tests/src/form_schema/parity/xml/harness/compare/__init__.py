"""Checks that compare a form's XML mapping with its JSON Schema and the Grants.gov XSD.

Each module covers one comparison:

    mapping_vs_xsd           elements the mapping produces against those the XSD declares
    mapping_vs_form_schema   fields the mapping reads against those the form has
    form_schema_vs_xsd       values a field accepts against those its element allows
    unchecked_rules          rules the checks can't read, against those the FormDiff lists

Every check takes a `FlatForm` from `flatten_form` and returns the `Discrepancy` objects
the form's `FormDiff` doesn't account for.
"""
