import logging

from apiflask import APIBlueprint
from sqlalchemy import text
from werkzeug.exceptions import ServiceUnavailable

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.api import response
from src.api.route_utils import raise_flask_error
from src.api.schemas.extension import fields
from src.api.schemas.response_schema import AbstractResponseSchema

logger = logging.getLogger(__name__)


class HealthcheckResponseSchema(AbstractResponseSchema):
    # We don't have any data to return with the healthcheck endpoint
    data = fields.MixinField(metadata={"example": None})


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

    return response.ApiResponse(message="Service healthy")
