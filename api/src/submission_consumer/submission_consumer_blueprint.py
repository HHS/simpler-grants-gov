from apiflask import APIBlueprint

# CLI-only blueprint - the submission consumer has no API routes.
submission_consumer_blueprint = APIBlueprint(
    "submission_consumer", __name__, cli_group="submission-consumer"
)
