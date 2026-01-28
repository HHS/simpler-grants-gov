from apiflask import APIBlueprint

workflow_blueprint = APIBlueprint(
    "workflow", __name__, url_prefix="/v1/workflows/", cli_group="workflow"
)
