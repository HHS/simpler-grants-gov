import logging

from grants_shared.adapters import db
from grants_shared.adapters.db import flask_db
from grants_shared.api import response
from grants_shared.api.route_utils import raise_flask_error
from grants_shared.util.deploy_metadata import get_deploy_metadata_config
from sqlalchemy import text
from werkzeug.exceptions import ServiceUnavailable

import src.api.healthcheck.healthcheck_schemas as healthcheck_schemas
from src.api.healthcheck.healthcheck_blueprint import healthcheck_blueprint

logger = logging.getLogger(__name__)


@healthcheck_blueprint.get("/health")
@healthcheck_blueprint.output(healthcheck_schemas.HealthcheckResponseSchema)
@healthcheck_blueprint.doc(responses=[200, ServiceUnavailable.code])
@flask_db.with_db_session()
def healthcheck_get(db_session: db.Session) -> response.ApiResponse:
    """Healthcheck endpoint - verifies database can be connected to and returns deploy metadata."""
    logger.info("GET /health")

    try:
        with db_session.begin():
            if db_session.scalar(text("SELECT 1 AS healthy")) != 1:
                raise Exception("Connection to Postgres DB failure")

    except Exception:
        logger.exception("Connection to DB failure")
        raise_flask_error(ServiceUnavailable.code, message="Service Unavailable")

    metadata_config = get_deploy_metadata_config()

    data = {
        "commit_sha": metadata_config.deploy_github_sha,
        "commit_link": metadata_config.deploy_commit,
        "release_notes_link": metadata_config.release_notes,
        "last_deploy_time": metadata_config.deploy_datetime_est,
        "deploy_whoami": metadata_config.deploy_whoami,
    }

    return response.ApiResponse(message="Service healthy", data=data)
