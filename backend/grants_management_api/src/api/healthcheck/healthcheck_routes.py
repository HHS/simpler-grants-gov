from grants_shared.adapters import db
from grants_shared.adapters.db import flask_db
from grants_shared.api import response
from grants_shared.util.deploy_metadata import get_deploy_metadata_config
from werkzeug.exceptions import ServiceUnavailable

import src.api.healthcheck.healthcheck_schemas as healthcheck_schemas
from src.api.healthcheck.healthcheck_blueprint import healthcheck_blueprint


@healthcheck_blueprint.get("/health")
@healthcheck_blueprint.output(healthcheck_schemas.HealthcheckResponseSchema)
@healthcheck_blueprint.doc(responses=[200, ServiceUnavailable.code])
@flask_db.with_db_session()
def health(db_session: db.Session) -> response.ApiResponse:

    # TODO - add DB stuff

    metadata_config = get_deploy_metadata_config()

    data = {
        "commit_sha": metadata_config.deploy_github_sha,
        "commit_link": metadata_config.deploy_commit,
        "release_notes_link": metadata_config.release_notes,
        "last_deploy_time": metadata_config.deploy_datetime_est,
        "deploy_whoami": metadata_config.deploy_whoami,
    }

    return response.ApiResponse(message="Service healthy", data=data)