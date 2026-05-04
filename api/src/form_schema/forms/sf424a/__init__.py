import importlib.util
from pathlib import Path

_path = Path(__file__).parent / "1" / "0" / "form_json.py"
_spec = importlib.util.spec_from_file_location(__name__ + "._v1_0", _path)
_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_module)
globals().update({k: v for k, v in vars(_module).items() if not k.startswith("_")})
del _path, _spec, _module
