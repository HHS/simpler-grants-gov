from apiflask import APIBlueprint

legacy_soap_api_blueprint = APIBlueprint(
    "legacy_soap_api_blueprint",
    __name__,
    tag="Legacy SOAP API",
    cli_group="legacy_soap_api",
)
