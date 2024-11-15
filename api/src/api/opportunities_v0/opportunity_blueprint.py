from apiflask import APIBlueprint

opportunity_blueprint = APIBlueprint(
    "opportunity_v0",
    __name__,
    tag="Opportunity v0",
    cli_group="opportunity_v0",
    url_prefix="/v0",
    # Before we fully deprecate the v0 endpoints
    # we want to hide them from Swagger/OpenAPI
    enable_openapi=False,
)
