import logging
import uuid
from collections.abc import Iterator
from typing import Any, BinaryIO

from pydantic import ValidationError

import src.adapters.db as db
from src.legacy_soap_api.applicants import schemas as applicants_schemas
from src.legacy_soap_api.applicants.services import get_opportunity_list_response
from src.legacy_soap_api.grantors import schemas as grantors_schemas
from src.legacy_soap_api.grantors.services import (
    get_application_zip_response,
    get_submission_list_expanded_response,
)
from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI
from src.legacy_soap_api.legacy_soap_api_constants import LegacySoapApiEvent
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest, SOAPResponse
from src.legacy_soap_api.legacy_soap_api_utils import (
    diff_soap_dicts,
    get_soap_response,
    json_formatter,
    log_local,
    wrap_envelope_dict,
    xml_formatter,
)
from src.legacy_soap_api.soap_payload_handler import (
    SOAPPayload,
    build_mtom_response_from_dict,
    build_xml_from_dict,
    get_envelope_dict,
    get_soap_operation_dict,
)

logger = logging.getLogger(__name__)


class BaseSOAPClient:
    def __init__(self, soap_request: SOAPRequest, db_session: db.Session) -> None:
        self.soap_request = soap_request
        self.operation_config = soap_request.get_soap_request_operation_config()
        self.db_session = db_session

    def get_soap_request_dict(self) -> dict:
        return get_soap_operation_dict(
            self.soap_request.data.decode(), self.operation_config.request_operation_name
        )

    def get_soap_response_dict(self) -> dict:
        """Get Simpler SOAP response dict

        This method will return the validated pydantic schema returned from the
        SOAP response operation. It will be in the format necessary to convert to and
        from XML utilizing SOAPPayload class.

        Example:
            {'Envelope': {'Body': {'GetOpportunityListResponse': {...}}}}
        """
        operation_method = getattr(self, self.operation_config.request_operation_name)
        return operation_method().to_soap_envelope_dict(
            self.operation_config.response_operation_name
        )

    def get_proxy_soap_response_dict(self, proxy_response: SOAPResponse) -> dict:
        """
        This method does the following:

        1. Gets the pydantic schema defined in self.operation_config.
        2. Converts the SOAP proxy response XML to a dict.
        3. Validates the XML dict.
        4. Returns the proxy XML dict from the pydantic schema data.

        This ensures parity when we need to compare proxy response to simpler
        SOAP response.

        Note: Ignoring type checking in return statement since we already check
        that the schema is not None prior to statement.
        """
        proxy_response_schema_data = wrap_envelope_dict(
            {}, self.operation_config.response_operation_name
        )

        simpler_response_schema = self._get_simpler_soap_response_schema()
        if simpler_response_schema is None:
            logger.info(
                "Unable to validate SOAP proxy response. No Simpler SOAP pydantic schema found.",
                extra={
                    "soap_api_event": LegacySoapApiEvent.NO_SIMPLER_SCHEMA_DEFINED,
                    "response_operation_name": self.operation_config.response_operation_name,
                },
            )
            return proxy_response_schema_data

        try:
            proxy_response_payload = SOAPPayload(
                proxy_response.to_bytes().decode(errors="replace"),
                operation_name=self.operation_config.response_operation_name,
                force_list_attributes=self.operation_config.force_list_attributes,
            )

            # The XML dict that includes namespaces and other attributes prior to normalization and schema validation.
            proxy_response_dict = proxy_response_payload.to_dict()
            log_local(
                msg="proxy response dict pre-validation",
                data=proxy_response_dict,
                formatter=json_formatter,
            )

            # Validated/normalized dict from pydantic schema.
            proxy_response_schema_dict = self._get_simpler_soap_response_schema()(
                **get_envelope_dict(
                    proxy_response_dict, self.operation_config.response_operation_name
                )
            )  # type: ignore[misc]
            return proxy_response_schema_dict.to_soap_envelope_dict(
                self.operation_config.response_operation_name
            )
        except ValidationError as e:
            msg = f"Could not parse proxy response {str(simpler_response_schema)} into Simpler SOAP response pydantic schema."
            error_fields = {(err["type"], err["loc"]) for err in e.errors()}
            logger.info(
                msg=f"{msg} {error_fields}",
                extra={
                    "soap_api_event": LegacySoapApiEvent.PROXY_RESPONSE_VALIDATION_PROBLEM,
                },
            )
        except Exception:
            logger.info(
                msg="Could not parse proxy response",
                exc_info=True,
                extra={"soap_api_event": LegacySoapApiEvent.UNPARSEABLE_SOAP_PROXY_RESPONSE},
            )
        return proxy_response_schema_data

    def log_diffs(self, proxy_response_soap_dict: dict, simpler_response_soap_dict: dict) -> None:
        try:
            diff_results = diff_soap_dicts(
                sgg_dict=get_envelope_dict(
                    simpler_response_soap_dict, self.operation_config.response_operation_name
                ),
                gg_dict=get_envelope_dict(
                    proxy_response_soap_dict, self.operation_config.response_operation_name
                ),
                key_indexes=self.operation_config.key_indexes,
                keys_only=True,
            )
            logger.info(
                "soap_api_diff complete",
                extra={"soap_api_diff": diff_results, "soap_responses_match": diff_results == {}},
            )
        except Exception:
            logger.info(
                "soap_api_diff incomplete",
                exc_info=True,
                extra={
                    "soap_responses_match": False,
                    "soap_api_event": LegacySoapApiEvent.SOAP_DIFF_FAILED,
                },
            )

    def get_simpler_soap_response(self, proxy_response: SOAPResponse) -> SOAPResponse:
        """
        This method is responsible getting the simpler soap xml payload.

        We first compare validated SOAP response dicts from simpler and
        proxy responses. We then utilize the SOAPPayload class to get the
        XML soap response from the validated XML dicts.
        """
        simpler_response_soap_dict = self.get_soap_response_dict()
        log_local(
            msg="simpler response dict", data=simpler_response_soap_dict, formatter=json_formatter
        )

        simpler_response_xml = build_xml_from_dict(
            operation_name=self.operation_config.response_operation_name,
            xml_dict=get_envelope_dict(
                simpler_response_soap_dict, self.operation_config.response_operation_name
            ),
            key_namespace_config=self.operation_config.namespace_keymap,
            namespaces=self.operation_config.namespaces,
        )
        log_local(msg="simpler response XML", data=simpler_response_xml, formatter=xml_formatter)
        if self.operation_config.compare_endpoints:
            proxy_response_soap_dict = self.get_proxy_soap_response_dict(proxy_response)
            log_local(
                msg="proxy response validated dict",
                data=proxy_response_soap_dict,
                formatter=json_formatter,
            )
            # We will only run diffs for responses that do not match.
            if proxy_response_soap_dict == simpler_response_soap_dict:
                logger.info("soap_api_diff responses match", extra={"soap_responses_match": True})
            else:
                self.log_diffs(proxy_response_soap_dict, simpler_response_soap_dict)

        return get_soap_response(data=simpler_response_xml)

    def _get_simpler_soap_response_schema(self) -> Any | None:
        if self.soap_request.api_name == SimplerSoapAPI.APPLICANTS:
            return getattr(applicants_schemas, self.operation_config.response_operation_name)
        # Grantors SOAP API schemas will be returned once they exist but will return None for now.
        return None


class SimplerApplicantsS2SClient(BaseSOAPClient):
    """Simpler SOAP API Client for Applicants SOAP API

    This class implements SOAP operations listed under the grants.gov services
    here: https://grants.gov/system-to-system/applicant-system-to-system/web-services/
    """

    def GetOpportunityListRequest(self) -> applicants_schemas.GetOpportunityListResponse:
        return get_opportunity_list_response(
            db_session=self.db_session,
            get_opportunity_list_request=applicants_schemas.GetOpportunityListRequest(
                **self.get_soap_request_dict()
            ),
        )


class SimplerGrantorsS2SClient(BaseSOAPClient):
    """Simpler SOAP API Client for Grantors SOAP API

    This class implements SOAP operations listed under the grants.gov services
    here: https://grants.gov/system-to-system/grantor-system-to-system/web-services
    """

    def GetApplicationZipRequest(self) -> grantors_schemas.GetApplicationZipResponseSOAPEnvelope:
        return get_application_zip_response(
            db_session=self.db_session,
            soap_request=self.soap_request,
            get_application_zip_request=grantors_schemas.GetApplicationZipRequest(
                **self.get_soap_request_dict()
            ),
            soap_config=self.operation_config,
        )

    def GetSubmissionListExpandedRequest(
        self,
    ) -> grantors_schemas.GetSubmissionListExpandedResponseSOAPEnvelope:
        soap_request_dict = self.get_soap_request_dict() or {}
        return get_submission_list_expanded_response(
            db_session=self.db_session,
            soap_request=self.soap_request,
            get_submission_list_expanded_request=grantors_schemas.GetSubmissionListExpandedRequest(
                **soap_request_dict
            ),
        )

    def _gen_response_data(
        self, mime_message: bytes, boundary: str, mtom_file_stream: BinaryIO
    ) -> Iterator:
        yield mime_message
        CHUNK_SIZE = 4000
        try:
            chunk = mtom_file_stream.read(CHUNK_SIZE)
            while chunk:
                yield chunk
                chunk = mtom_file_stream.read(CHUNK_SIZE)
                if not chunk:
                    break
        finally:
            mtom_file_stream.close()
        yield b"\n" + boundary.encode("utf-8") + b"--"

    def get_simpler_soap_response(self, proxy_response: SOAPResponse) -> SOAPResponse:
        if proxy_response.status_code != 500:
            return proxy_response
        if not self.operation_config.is_mtom:
            return proxy_response
        # MTOM message is assembled here
        # 1. --uuid: {boundary_uuid}\n
        # 2. headers:
        #    'Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"\n'
        #    "Content-Transfer-Encoding: binary\n"
        #    "Content-ID: <root.message@cxf.apache.org>\n\n"
        # 3. MTOM xml body
        # 4. --uuid: {boundary_uuid}
        # 5. the file bytes from the file being attached
        # 6. --uuid: {boundary_uuid}--
        simpler_response_soap_dict = self.get_soap_response_dict()
        mtom_file_stream = simpler_response_soap_dict.pop("_mtom_file_stream", None)
        log_local(
            msg="simpler response dict", data=simpler_response_soap_dict, formatter=json_formatter
        )
        boundary_uuid = str(uuid.uuid4())
        update_headers = {
            "MIME-Version": "1.0",
            "Content-Type": f'multipart/related; type="application/xop+xml"; boundary="uuid:{boundary_uuid}"; start="<root.message@cxf.apache.org>"; start-info="text/xml"',
        }
        boundary = "--uuid:" + boundary_uuid
        mime_message = build_mtom_response_from_dict(
            simpler_response_soap_dict,
            boundary_uuid,
            self.operation_config.namespaces,
            root=self.operation_config.response_operation_name,
        )
        if self.operation_config.response_operation_name != "GetApplicationZipResponse":
            mime_message += f"\n--uuid:{boundary_uuid}--".encode("utf-8")
            return get_soap_response(
                data=mime_message,
                headers=update_headers,
            )
        if mtom_file_stream:
            mime_message += ("\n" + boundary + "\n").encode("utf8")
            return get_soap_response(
                data=self._gen_response_data(mime_message, boundary, mtom_file_stream),
                headers=update_headers,
            )
        return proxy_response
