import logging
from typing import Any

import grants_shared.adapters.db as db
import grants_shared.adapters.db.flask_db as flask_db
import grants_shared.logs
import grants_shared.logs.flask_logger as flask_logger
from apiflask import APIFlask, exceptions
from flask_cors import CORS
from grants_shared.api.response import restructure_error_response
from grants_shared.api.schemas import response_schema
from grants_shared.auth.api_jwt_auth import initialize_jwt_auth
from grants_shared.auth.login_gov_jwt_auth import initialize_login_gov_config

from src.adapters.newrelic import init_newrelic
from src.api.healthcheck.healthcheck_blueprint import healthcheck_blueprint
from src.api.users.user_blueprint import user_blueprint
from src.app_config import AppConfig
from src.task.task_blueprint import task_blueprint

logger = logging.getLogger(__name__)

TITLE = "Grants Management API"
API_OVERALL_VERSION = "v0"
API_DESCRIPTION = """
Back end API for Grants Management.

This API is in early development, and is not yet ready for public use.
"""


def create_app() -> APIFlask:
    app = APIFlask(__name__, title=TITLE, version=API_OVERALL_VERSION)

    setup_logging(app)
    init_newrelic()
    register_db_client(app)

    CORS(app)
    configure_app(app)
    register_blueprints(app)

    # Initialize auth
    initialize_login_gov_config()
    initialize_jwt_auth()

    register_index(app)
    register_robots_txt(app)

    logger.info("Finished setting up Flask app")
    return app


def setup_logging(app: APIFlask) -> None:
    grants_shared.logs.init(__package__)
    flask_logger.init_app(logging.root, app, "grants-management")


def register_db_client(app: APIFlask) -> None:
    db_client = db.PostgresDBClient()
    flask_db.register_db_client(db_client, app)


def register_blueprints(app: APIFlask) -> None:

    app.register_blueprint(healthcheck_blueprint)

    app.register_blueprint(task_blueprint)
    app.register_blueprint(user_blueprint)


def configure_app(app: APIFlask) -> None:
    app_config = AppConfig()

    # Set maximum file upload size (2 GB)
    app.config["MAX_CONTENT_LENGTH"] = app_config.max_file_upload_size_bytes
    app.config["HTTP_ERROR_SCHEMA"] = response_schema.ErrorResponseSchema
    app.config["VALIDATION_ERROR_SCHEMA"] = response_schema.ErrorResponseSchema
    app.config["SWAGGER_UI_CSS"] = "/static/swagger-ui.min.css"
    app.config["SWAGGER_UI_BUNDLE_JS"] = "/static/swagger-ui-bundle.js"
    app.config["SWAGGER_UI_STANDALONE_PRESET_JS"] = "/static/swagger-ui-standalone-preset.js"
    app.config["SWAGGER_UI_CONFIG"] = {
        "persistAuthorization": app_config.persist_authorization_openapi
    }
    # Removing because the server dropdown has accessibility issues.
    app.config["SERVERS"] = "."
    app.config["DOCS_FAVICON"] = "https://simpler.grants.gov/img/favicon.ico"

    # Set a few values for the Swagger endpoint
    app.config["OPENAPI_VERSION"] = "3.1.0"

    app.json.compact = False  # type: ignore

    # Set various general OpenAPI config values
    app.info = {
        "description": API_DESCRIPTION,
        "contact": {
            "name": "Grants Management",
            "url": "https://simpler.grants.gov/",
            "email": "simpler@grants.gov",
        },
    }

    # Set the security schema and define the header param
    # where we expect the API token to reside.
    # See: https://apiflask.com/authentication/#use-external-authentication-library
    # TODO - https://github.com/HHS/simpler-grants-gov/issues/11022
    # app.security_schemes = get_app_security_scheme()

    @app.error_processor
    def error_processor(error: exceptions.HTTPError) -> tuple[dict, int, Any]:
        return restructure_error_response(error)


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


def register_robots_txt(app: APIFlask) -> None:
    @app.route("/robots.txt")
    @app.doc(hide=True)
    def robots() -> str:
        return """
        User-Agent: *
        Allow: /docs
        Disallow: /
        """
