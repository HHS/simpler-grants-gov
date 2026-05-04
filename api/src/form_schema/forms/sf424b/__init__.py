import importlib.util
from pathlib import Path

_path = Path(__file__).parent / "1" / "0" / "form_json.py"
_spec = importlib.util.spec_from_file_location(__name__ + "._v1_0", _path)
if _spec is None or _spec.loader is None:
    raise RuntimeError(f"Could not load form module from {_path}")
_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_module)

FORM_JSON_SCHEMA = _module.FORM_JSON_SCHEMA
FORM_UI_SCHEMA = _module.FORM_UI_SCHEMA
FORM_RULE_SCHEMA = _module.FORM_RULE_SCHEMA
FORM_XML_TRANSFORM_RULES = _module.FORM_XML_TRANSFORM_RULES
SF424b_v1_1 = _module.SF424b_v1_1

del _path, _spec, _module
