from typing import Any


def get_app_security_scheme() -> dict[str, Any]:
    return {
        "ApiKeyAuth": {"type": "apiKey", "in": "header", "name": "X-Auth"},
        "ApiJwtAuth": {"type": "apiKey", "in": "header", "name": "X-SGG-Token"},
    }
