import logging

from apiflask import APIBlueprint
from grants_shared.adapters import db
from grants_shared.adapters.db import flask_db
from grants_shared.api.route_utils import raise_flask_error
from sqlalchemy import text

logger = logging.getLogger(__name__)

healthcheck_blueprint = APIBlueprint("healthcheck", __name__, tag="Health")


@healthcheck_blueprint.get("/health")
@flask_db.with_db_session()
def healthcheck(db_session: db.Session):
    try:
        with db_session.begin():
            if db_session.scalar(text("SELECT 1 AS healthy")) != 1:
                raise Exception("Connection to Postgres DB failure")

    except Exception:
        logger.exception("Connection to DB failure")
        raise_flask_error(500, message="Service Unavailable")
    # TODO - proper type here
    return {"message": "Success"}
