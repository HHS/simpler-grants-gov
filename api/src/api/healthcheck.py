import logging

from apiflask import APIBlueprint
from sqlalchemy import text
from werkzeug.exceptions import ServiceUnavailable

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.api import response
from src.api.route_utils import raise_flask_error
from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema
from src.util.deploy_metadata import get_deploy_metadata_config

logger = logging.getLogger(__name__)


class HealthcheckMetadataSchema(Schema):

    commit_sha = fields.String(
        metadata={
            "description": "The github commit sha for the latest deployed commit",
            "example": "ffaca647223e0b6e54344122eefa73401f5ec131",
        }
    )
    commit_link = fields.String(
        metadata={
            "description": "A github link to the latest deployed commit",
            "example": "https://github.com/HHS/simpler-grants-gov/commit/main",
        }
    )

    release_notes_link = fields.String(
        metadata={
            "description": "A github link to the release notes - direct if the latest deploy was a release",
            "example": "https://github.com/HHS/simpler-grants-gov/releases",
        }
    )

    last_deploy_time = fields.DateTime(
        metadata={"description": "Latest deploy time in US/Eastern timezone"}
    )


class HealthcheckResponseSchema(AbstractResponseSchema):
    # We don't have any data to return with the healthcheck endpoint
    data = fields.Nested(HealthcheckMetadataSchema())


healthcheck_blueprint = APIBlueprint("healthcheck", __name__, tag="Health")


@healthcheck_blueprint.get("/health")
@healthcheck_blueprint.output(HealthcheckResponseSchema)
@healthcheck_blueprint.doc(responses=[200, ServiceUnavailable.code])
@flask_db.with_db_session()
def health(db_session: db.Session) -> response.ApiResponse:
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
    }

    return response.ApiResponse(message="Service healthy", data=data)
