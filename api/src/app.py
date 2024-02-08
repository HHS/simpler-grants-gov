import logging
import os
from typing import Any, Optional, Tuple

from apiflask import APIFlask, exceptions
from flask import g
from werkzeug.exceptions import Unauthorized

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.api.feature_flags.feature_flag_config as feature_flag_config
import src.logging
import src.logging.flask_logger as flask_logger
from src.api.healthcheck import healthcheck_blueprint
from src.api.opportunities import opportunity_blueprint_v0, opportunity_blueprint_v0_1
from src.api.response import restructure_error_response
from src.api.schemas import response_schema
from src.auth.api_key_auth import User, get_app_security_scheme

logger = logging.getLogger(__name__)

TITLE = "Simpler Grants API"
API_OVERALL_VERSION = "v0"
API_DESCRIPTION = """
Back end API for simpler.grants.gov.

This API is an ALPHA VERSION! Its current form is primarily for testing and feedback. Features are still under heavy development, and subject to change. Not for production use.

See [Release Phases](https://github.com/github/roadmap?tab=readme-ov-file#release-phases) for further details.
"""


def create_app() -> APIFlask:
    app = APIFlask(__name__, title=TITLE, version=API_OVERALL_VERSION)

    setup_logging(app)
    register_db_client(app)

    feature_flag_config.initialize()

    configure_app(app)
    register_blueprints(app)
    register_index(app)

    return app


def current_user(is_user_expected: bool = True) -> Optional[User]:
    current = g.get("current_user")
    if is_user_expected and current is None:
        logger.error("No current user found for request")
        raise Unauthorized
    return current


def setup_logging(app: APIFlask) -> None:
    src.logging.init(__package__)
    flask_logger.init_app(logging.root, app)


def register_db_client(app: APIFlask) -> None:
    db_client = db.PostgresDBClient()
    flask_db.register_db_client(db_client, app)


def configure_app(app: APIFlask) -> None:
    # Modify the response schema to instead use the format of our ApiResponse class
    # which adds additional details to the object.
    # https://apiflask.com/schema/#base-response-schema-customization
    app.config["BASE_RESPONSE_SCHEMA"] = response_schema.ResponseSchema
    app.config["HTTP_ERROR_SCHEMA"] = response_schema.ErrorResponseSchema
    app.config["VALIDATION_ERROR_SCHEMA"] = response_schema.ErrorResponseSchema
    app.config["DOCS_FAVICON"] = "https://simpler.grants.gov/img/favicon.ico"

    # Set a few values for the Swagger endpoint
    app.config["OPENAPI_VERSION"] = "3.1.0"

    app.json.compact = False  # type: ignore

    # Set various general OpenAPI config values
    app.info = {
        "description": API_DESCRIPTION,
        "contact": {
            "name": "Simpler Grants.gov",
            "url": "https://simpler.grants.gov/",
            "email": "simplergrantsgov@hhs.gov",
        },
    }

    # Set the security schema and define the header param
    # where we expect the API token to reside.
    # See: https://apiflask.com/authentication/#use-external-authentication-library
    app.security_schemes = get_app_security_scheme()

    @app.error_processor
    def error_processor(error: exceptions.HTTPError) -> Tuple[dict, int, Any]:
        return restructure_error_response(error)


def register_blueprints(app: APIFlask) -> None:
    app.register_blueprint(healthcheck_blueprint)
    app.register_blueprint(opportunity_blueprint_v0)
    app.register_blueprint(opportunity_blueprint_v0_1)


def get_project_root_dir() -> str:
    return os.path.join(os.path.dirname(__file__), "..")


def register_index(app: APIFlask) -> None:
    @app.route("/")
    @app.doc(hide=True)
    def index() -> str:
        return """
            <!Doctype html>
            <html>
                <head><title>Home</title></head>
                <body>
                    <h1>Home</h1>
                    <p>Visit <a href="/docs">/docs</a> to view the api documentation for this project.</p>
                </body>
            </html>
        """
