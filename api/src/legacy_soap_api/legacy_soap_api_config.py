import json
import logging
from dataclasses import dataclass, field
from enum import StrEnum
from functools import cache, lru_cache
from typing import Any

from pydantic import Field

from src.legacy_soap_api.legacy_soap_api_constants import LegacySoapApiEvent
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class LegacySoapAPIConfig(PydanticBaseEnvConfig):
    grants_gov_uri: str = Field(alias="GRANTS_GOV_URI")
    grants_gov_port: int = Field(default=443, alias="GRANTS_GOV_PORT")
    soap_api_enabled: bool = Field(default=False, alias="ENABLE_SOAP_API")
    inject_uuid_data: bool = Field(default=False, alias="INJECT_UUID_SOAP_RESPONSE")
    gg_s2s_proxy_header_key: str = Field(default="", alias="GG_S2S_PROXY_HEADER_KEY")
    soap_auth_content: str | None = Field(None, alias="SOAP_AUTH_CONTENT")
    soap_auth_map: dict = Field(default_factory=dict)
    enable_verbose_logging: bool = Field(default=False, alias="SOAP_ENABLE_VERBOSE_LOGGING")

    @property
    def gg_url(self) -> str:
        # Full url including port for grants.gov S2S SOAP API.
        return f"{self.grants_gov_uri}:{self.grants_gov_port}"

    def model_post_init(self, _context: Any) -> None:
        self.soap_auth_map = {}
        if self.soap_auth_content is not None:
            try:
                self.soap_auth_map = json.loads(self.soap_auth_content.replace("\n", "\\n"))
            except Exception:
                # This except is to make sure the API still starts up, even if the value is malformed
                logger.exception(
                    "Could not load soap auth content",
                    extra={"soap_api_event": LegacySoapApiEvent.INVALID_SOAP_AUTH_CONTENT_CONFIG},
                )


@cache
def get_soap_config() -> LegacySoapAPIConfig:
    # This is cached since any changes the config will require app restart anyways.
    return LegacySoapAPIConfig()


class SimplerSoapAPI(StrEnum):
    GRANTORS = "grantors"
    APPLICANTS = "applicants"

    @staticmethod
    def get_soap_api(service_name: str, service_port_name: str) -> "SimplerSoapAPI | None":
        if service_name == "grantsws-agency" and service_port_name == "AgencyWebServicesSoapPort":
            return SimplerSoapAPI.GRANTORS
        elif (
            service_name == "grantsws-applicant"
            and service_port_name == "ApplicantWebServicesSoapPort"
        ):
            return SimplerSoapAPI.APPLICANTS
        return None


@dataclass
class SOAPOperationConfig:
    request_operation_name: str
    response_operation_name: str
    compare_endpoints: bool = False

    # Some SOAP XML payloads will not force a list of objects when converting to
    # dicts if there is only one child element entry in the sequence. This config
    # forces elements specified here to be a list when converting XML to a dict.
    force_list_attributes: tuple | None = tuple()

    # This config is used for insights when diffing proxy and simpler soap responses.
    key_indexes: dict[str, str] | None = None

    # This value holds all namespace mappings per soap api. Grantors and Applicants APIs
    # will have different namespace configurations.
    namespaces: dict[None | str, str] = field(default_factory=dict)

    # Configuration for XML namespace mapping to generate XML from SOAP XML dicts.
    # This will only be needed for the simpler SOAP data processing. The values for this property
    # are derived from the namespaces attribute in this class. The data in this
    # config should align with what the existing GG SOAP response namespaces. Not all tags have
    # namespaces or namespace prefixes.
    namespace_keymap: dict[str, str | None] = field(default_factory=dict)


SIMPLER_SOAP_OPERATION_CONFIGS: dict[SimplerSoapAPI, dict[str, SOAPOperationConfig]] = {
    SimplerSoapAPI.APPLICANTS: {
        "GetOpportunityListRequest": SOAPOperationConfig(
            request_operation_name="GetOpportunityListRequest",
            response_operation_name="GetOpportunityListResponse",
            force_list_attributes=("OpportunityDetails",),
            key_indexes={"OpportunityDetails": "CompetitionID"},
            compare_endpoints=True,
            namespace_keymap={
                "GetOpportunityListResponse": "ns2",
                "OpportunityDetails": "ns5",
                "CFDADetails": "ns5",
                "Number": "ns5",
                "Title": "ns5",
                "OpeningDate": "ns5",
                "ClosingDate": "ns5",
                "OfferingAgency": "ns4",
                "AgencyContactInfo": None,  # No namespace prefix
                "CompetitionID": None,  # No namespace prefix
                "CompetitionTitle": None,  # No namespace prefix
                "FundingOpportunityTitle": None,  # No namespace prefix
                "FundingOpportunityNumber": None,  # No namespace prefix
                "IsMultiProject": None,  # No namespace prefix
                "PackageID": None,  # No namespace prefix
                "SchemaURL": None,  # No namespace prefix
            },
        )
    },
    SimplerSoapAPI.GRANTORS: {},
}

# This is a standard global namespace for SOAP XML.
SOAP_NS = "http://schemas.xmlsoap.org/soap/envelope/"

# Namespaces for SOAP API XML data.
SOAP_API_NAMESPACES: dict[SimplerSoapAPI, dict[str | None, str]] = {
    SimplerSoapAPI.APPLICANTS: {
        "soap": SOAP_NS,
        "ns2": "http://apply.grants.gov/services/ApplicantWebServices-V2.0",
        "ns3": "http://schemas.xmlsoap.org/wsdl/",
        "ns4": "http://schemas.xmlsoap.org/wsdl/soap/",
        "ns5": "http://apply.grants.gov/system/ApplicantCommonElements-V1.0",
        None: "http://apply.grants.gov/system/GrantsCommonElements-V1.0",
    },
    SimplerSoapAPI.GRANTORS: {
        "soap": SOAP_NS,
    },
}


@lru_cache()
def get_soap_operation_config(
    simpler_api: SimplerSoapAPI, request_operation_name: str
) -> SOAPOperationConfig | None:
    operation_config = SIMPLER_SOAP_OPERATION_CONFIGS.get(simpler_api, {}).get(
        request_operation_name
    )
    if operation_config is None:
        return None
    operation_config.namespaces = SOAP_API_NAMESPACES.get(simpler_api, {})
    return operation_config
