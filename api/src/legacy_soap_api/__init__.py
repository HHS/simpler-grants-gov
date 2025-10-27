from apiflask import APIFlask

from src.legacy_soap_api.legacy_soap_api_blueprint import legacy_soap_api_blueprint

import src.legacy_soap_api.legacy_soap_api_routes  # noqa: F401 isort:skip


def init_app(app: APIFlask) -> None:
    app.register_blueprint(legacy_soap_api_blueprint)


__all__ = ["legacy_soap_api_blueprint"]
