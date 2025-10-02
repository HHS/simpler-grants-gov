import click
import yaml
from apiflask import APIBlueprint, APIFlask

from src.api.common_grants.common_grants_schemas import Error
from src.api.common_grants.common_grants_openapi import transform_spec_composition_to_cg

common_grants_blueprint = APIBlueprint(
    "common_grants",
    __name__,
    tag="CommonGrants Protocol",
    cli_group="common_grants",
    url_prefix="/common-grants",
)


@common_grants_blueprint.cli.command("spec")
@click.option(
    "--output", "-o", "output_file", type=click.Path(), help="The file path to the spec file"
)
def generate_openapi_spec(output_file: str | None) -> None:
    """Generate OpenAPI specification for CommonGrants API routes."""

    # Create app and register only the CommonGrants blueprint
    app = APIFlask(
        __name__,
        title="CommonGrants API",
        version="0.1.0",
    )
    app.description = "An implementation of the CommonGrants API specification"
    app.config["HTTP_ERROR_SCHEMA"] = Error
    app.register_blueprint(common_grants_blueprint)

    # Transform the APIFlask OpenAPI spec composition to meet CG expectations
    spec = transform_spec_composition_to_cg(app.spec)  # type: ignore[arg-type]
    yaml_content = yaml.dump(spec, sort_keys=False)

    if output_file:
        with open(output_file, "w") as f:
            f.write(yaml_content)
    else:
        import sys

        sys.stdout.write(yaml_content)
