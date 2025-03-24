from src.legacy_soap_api.legacy_soap_api_blueprint import legacy_soap_api_blueprint

import src.legacy_soap_api.legacy_soap_api_routes  # noqa: F401 E402 isort:skip

__all__ = ["legacy_soap_api_blueprint"]
