from apiflask import APIBlueprint

task_blueprint = APIBlueprint("task", __name__, enable_openapi=False, cli_group="task")
