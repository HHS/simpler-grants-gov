from apiflask import APIBlueprint

healthcheck_blueprint = APIBlueprint("healthcheck", __name__, tag="Health")

@healthcheck_blueprint.get("/health")
def healthcheck():
    # TODO - proper type here
    return {"message": "Success"}