import importlib.util
import types
from pathlib import Path


def load_versioned_form(path: Path, version: str) -> types.ModuleType:
    major, minor = version.split(".")
    form_path = path / major / minor / "form_json.py"
    spec = importlib.util.spec_from_file_location(f"{path.name}._v{major}_{minor}", form_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load form module from {form_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module
