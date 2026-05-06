from apiflask import APIFlask

TITLE = "TODO"
API_OVERALL_VERSION = "0.0.1"
API_DESCRIPTION = "TODO - description"

def create_app() -> APIFlask:
    app = APIFlask(__name__, title=TITLE, version=API_OVERALL_VERSION)

    # TODO logging
    # TODO new relic
    # TODO DB client

    # TODO CORS
    # TODO configure app
    # TODO register blueprints
    # TODO index
    # TODO robots.txt

    # TODO - auth (login.gov)
    # TODO - jwt auth setup

    return app

def configure_app(app: APIFlask) -> None:
    # TODO - app config
    # app_config = AppConfig()

    # Set maximum file upload size (2 GB)
    # app.config["MAX_CONTENT_LENGTH"] = app_config.max_file_upload_size_bytes
    # app.config["HTTP_ERROR_SCHEMA"] = response_schema.ErrorResponseSchema
    # app.config["VALIDATION_ERROR_SCHEMA"] = response_schema.ErrorResponseSchema
    app.config["SWAGGER_UI_CSS"] = "/static/swagger-ui.min.css"
    app.config["SWAGGER_UI_BUNDLE_JS"] = "/static/swagger-ui-bundle.js"
    app.config["SWAGGER_UI_STANDALONE_PRESET_JS"] = "/static/swagger-ui-standalone-preset.js"
    # app.config["SWAGGER_UI_CONFIG"] = {
    #     "persistAuthorization": app_config.persist_authorization_openapi
    # }
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
    # app.security_schemes = get_app_security_scheme()

    # @app.error_processor
    # def error_processor(error: exceptions.HTTPError) -> tuple[dict, int, Any]:
    #     return restructure_error_response(error)


def register_blueprints(app: APIFlask) -> None:
    app.register_blueprint()