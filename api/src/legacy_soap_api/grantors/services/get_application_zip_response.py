import uuid

import src.adapters.db as db
from src.legacy_soap_api.grantors import schemas as grantor_schemas


def get_application_zip_response(
    db_session: db.Session, get_application_zip_request: grantor_schemas.GetApplicationZipRequest
) -> grantor_schemas.GetApplicationZipResponseSOAPEnvelope:
    cid_uuid = f"{uuid.uuid4()}"
    xop_data_instance = grantor_schemas.XOPIncludeData(
        **{"@href": f"cid:{cid_uuid}-3975@apply.grants.gov"}
    )
    file_handler_instance = grantor_schemas.FileDataHandler(**{"xop:Include": xop_data_instance})
    get_response_instance = grantor_schemas.GetApplicationZipResponse(
        **{"ns2:FileDataHandler": file_handler_instance}
    )
    return grantor_schemas.GetApplicationZipResponseSOAPEnvelope(
        Body=grantor_schemas.GetApplicationZipResponseSOAPBody(
            **{"ns2:GetApplicationZipResponse": get_response_instance}
        )
    )
