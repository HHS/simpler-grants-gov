import json
import logging
import os
from typing import Any

from apiflask import APIFlask, exceptions
from flask import Response
from flask_cors import CORS
from pydantic import Field

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.adapters.search as search
import src.adapters.search.flask_opensearch as flask_opensearch
import src.api.feature_flags.feature_flag_config as feature_flag_config
import src.logging
import src.logging.flask_logger as flask_logger
from src.adapters.newrelic import init_newrelic
from src.api.agencies_v1 import agency_blueprint as agencies_v1_blueprint
from src.api.application_alpha import application_blueprint
from src.api.common_grants import common_grants_blueprint
from src.api.competition_alpha import competition_blueprint
from src.api.extracts_v1 import extract_blueprint as extracts_v1_blueprint
from src.api.form_alpha import form_blueprint
from src.api.healthcheck import healthcheck_blueprint
from src.api.internal import internal_blueprint
from src.api.local import local_blueprint
from src.api.opportunities_v1 import opportunity_blueprint as opportunities_v1_blueprint
from src.api.organizations_v1 import organization_blueprint as organizations_v1_blueprint
from src.api.response import restructure_error_response
from src.api.schemas import response_schema
from src.api.users.user_blueprint import user_blueprint
from src.app_config import AppConfig
from src.auth.api_jwt_auth import initialize_jwt_auth
from src.auth.auth_utils import get_app_security_scheme
from src.auth.login_gov_jwt_auth import initialize_login_gov_config
from src.data_migration.data_migration_blueprint import data_migration_blueprint
from src.legacy_soap_api import init_app as init_legacy_soap_api
from src.legacy_soap_api.legacy_soap_api_config import LegacySoapAPIConfig
from src.search.backend.load_search_data_blueprint import load_search_data_blueprint
from src.task import task_blueprint
from src.util.env_config import PydanticBaseEnvConfig
from src.util.local import error_if_not_local

logger = logging.getLogger(__name__)

TITLE = "Simpler Grants API"
API_OVERALL_VERSION = "v0"
API_DESCRIPTION = """
Back end API for simpler.grants.gov.

This API is an ALPHA VERSION! Its current form is primarily for testing and feedback. Features are still under heavy development, and subject to change. Not for production use.

See [Release Phases](https://github.com/github/roadmap?tab=readme-ov-file#release-phases) for further details.
"""


class EndpointConfig(PydanticBaseEnvConfig):
    auth_endpoint: bool = Field(False, alias="ENABLE_AUTH_ENDPOINT")

    enable_apply_endpoints: bool = Field(False, alias="ENABLE_APPLY_ENDPOINTS")
    enable_common_grants_endpoints: bool = Field(False, alias="ENABLE_COMMON_GRANTS_ENDPOINTS")
    domain_verification_content: str | None = Field(None, alias="DOMAIN_VERIFICATION_CONTENT")
    domain_verification_map: dict = Field(default_factory=dict)

    # Do not ever change this to True, this controls endpoints we only
    # want to exist for local development.
    enable_local_endpoints: bool = Field(False, alias="ENABLE_LOCAL_ENDPOINTS")

    def model_post_init(self, _context: Any) -> None:
        self.domain_verification_map = {}
        if self.domain_verification_content is not None:
            try:
                self.domain_verification_map = json.loads(self.domain_verification_content)
            except Exception:
                # This except is to prevent the entire API from starting up if the value is malformed
                logger.exception("Could not load domain verification content")


def create_app() -> APIFlask:
    app = APIFlask(__name__, title=TITLE, version=API_OVERALL_VERSION)

    setup_logging(app)
    init_newrelic()
    register_db_client(app)

    feature_flag_config.initialize()

    CORS(app)
    configure_app(app)
    register_blueprints(app)
    register_index(app)
    register_robots_txt(app)
    register_search_client(app)

    endpoint_config = EndpointConfig()
    if endpoint_config.auth_endpoint:
        initialize_login_gov_config()
        initialize_jwt_auth()

    if LegacySoapAPIConfig().soap_api_enabled:
        init_legacy_soap_api(app)

    register_well_known(app, endpoint_config.domain_verification_map)

    return app


def setup_logging(app: APIFlask) -> None:
    src.logging.init(__package__)
    flask_logger.init_app(logging.root, app)


def register_db_client(app: APIFlask) -> None:
    db_client = db.PostgresDBClient()
    flask_db.register_db_client(db_client, app)


def register_search_client(app: APIFlask) -> None:
    search_client = search.SearchClient()
    flask_opensearch.register_search_client(search_client, app)


def configure_app(app: APIFlask) -> None:
    app_config = AppConfig()

    # Set maximum file upload size (2 GB)
    app.config["MAX_CONTENT_LENGTH"] = app_config.max_file_upload_size_bytes

    # Modify the response schema to instead use the format of our ApiResponse class
    # which adds additional details to the object.
    # https://apiflask.com/schema/#base-response-schema-customization
    # app.config["BASE_RESPONSE_SCHEMA"] = response_schema.ResponseSchema
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
            "name": "Simpler Grants.gov",
            "url": "https://simpler.grants.gov/",
            "email": "simpler@grants.gov",
        },
    }

    # Set the security schema and define the header param
    # where we expect the API token to reside.
    # See: https://apiflask.com/authentication/#use-external-authentication-library
    app.security_schemes = get_app_security_scheme()

    @app.error_processor
    def error_processor(error: exceptions.HTTPError) -> tuple[dict, int, Any]:
        return restructure_error_response(error)


def register_blueprints(app: APIFlask) -> None:
    app.register_blueprint(healthcheck_blueprint)
    app.register_blueprint(opportunities_v1_blueprint)
    app.register_blueprint(extracts_v1_blueprint)
    app.register_blueprint(agencies_v1_blueprint)
    app.register_blueprint(organizations_v1_blueprint)
    app.register_blueprint(internal_blueprint)

    endpoint_config = EndpointConfig()
    if endpoint_config.auth_endpoint:
        app.register_blueprint(user_blueprint)

    # Endpoints for apply functionality
    if endpoint_config.enable_apply_endpoints:
        app.register_blueprint(application_blueprint)
        app.register_blueprint(form_blueprint)
        app.register_blueprint(competition_blueprint)

    # CommonGrants Protocol endpoints
    if endpoint_config.enable_common_grants_endpoints:
        app.register_blueprint(common_grants_blueprint)

    # Local endpoints for development, will error
    # if this is ever enabled non-locally.
    if endpoint_config.enable_local_endpoints:
        error_if_not_local()
        app.register_blueprint(local_blueprint)

    # Non-api blueprints
    app.register_blueprint(data_migration_blueprint)
    app.register_blueprint(task_blueprint)
    app.register_blueprint(load_search_data_blueprint)


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


def register_robots_txt(app: APIFlask) -> None:
    @app.route("/robots.txt")
    @app.doc(hide=True)
    def robots() -> str:
        return """
        User-Agent: *
        Allow: /docs
        Disallow: /
        """


def register_well_known(app: APIFlask, domain_verification_map: dict) -> None:
    @app.get("/.well-known/pki-validation/<file_name>")
    @app.doc(hide=True)
    def get_domain_verification_content(file_name: str) -> Response:
        """Domain verification

        This endpoint is responsible for domain verification related
        to grants.gov S2S SOAP API.
        """
        if file_name in domain_verification_map:
            return Response(domain_verification_map[file_name], mimetype="text/plain", status=200)
        return Response(f"Could not find {file_name}", mimetype="text/plain", status=404)
