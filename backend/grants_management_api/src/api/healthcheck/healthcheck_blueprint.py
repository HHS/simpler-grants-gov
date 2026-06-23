from apiflask import APIBlueprint

healthcheck_blueprint = APIBlueprint("healthcheck", __name__, tag="Health")