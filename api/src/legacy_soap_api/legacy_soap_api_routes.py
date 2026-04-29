import logging

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.legacy_soap_api.legacy_soap_api_blueprint import legacy_soap_api_blueprint
from src.legacy_soap_api.simpler_soap_api import process_simpler_request
from src.logging.flask_logger import add_extra_data_to_current_request_logs

logger = logging.getLogger(__name__)


@legacy_soap_api_blueprint.post("/<service_name>/services/v2/<service_port_name>")
@flask_db.with_db_session()
def simpler_soap_api_route(
    db_session: db.Session, service_name: str, service_port_name: str
) -> tuple:
    add_extra_data_to_current_request_logs(
        {
            "service_name": service_name,
            "service_port_name": service_port_name,
        }
    )
    logger.info("POST /<service_name>/services/v2/<service_port_name>")
    with db_session.begin():
        return process_simpler_request(db_session, service_name, service_port_name)
