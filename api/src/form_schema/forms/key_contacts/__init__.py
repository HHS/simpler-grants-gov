from pathlib import Path

from src.form_schema.forms._loader import load_versioned_form

_mod = load_versioned_form(Path(__file__).parent, "1.0")
FORM_JSON_SCHEMA = _mod.FORM_JSON_SCHEMA
FORM_UI_SCHEMA = _mod.FORM_UI_SCHEMA
# No FORM_RULE_SCHEMA — this form has no conditional fields, attachments, or pre/post-population
FORM_XML_TRANSFORM_RULES = _mod.FORM_XML_TRANSFORM_RULES
KeyContacts_v2_0 = _mod.KeyContacts_v2_0
del _mod
