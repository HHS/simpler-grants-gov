import json
import logging
from dataclasses import dataclass
from enum import Enum
from functools import cache, lru_cache
from typing import Any, Optional

from pydantic import Field

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
                logger.exception("Could not load soap auth content")


@cache
def get_soap_config() -> LegacySoapAPIConfig:
    # This is cached since any changes the config will require app restart anyways.
    return LegacySoapAPIConfig()


class SimplerSoapAPI(Enum):
    GRANTORS = "grantors"
    APPLICANTS = "applicants"

    @staticmethod
    def get_soap_api(service_name: str, service_port_name: str) -> Optional["SimplerSoapAPI"]:
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
    force_list_attributes: tuple | None = tuple()


SIMPLER_SOAP_OPERATION_CONFIG_CACHE_SIZE = 10
SIMPLER_SOAP_OPERATION_CONFIGS: dict[SimplerSoapAPI, dict[str, SOAPOperationConfig]] = {
    SimplerSoapAPI.APPLICANTS: {
        "GetOpportunityListRequest": SOAPOperationConfig(
            request_operation_name="GetOpportunityListRequest",
            response_operation_name="GetOpportunityListResponse",
            force_list_attributes=("OpportunityDetails",),
        )
    },
    SimplerSoapAPI.GRANTORS: {},
}


@lru_cache(maxsize=SIMPLER_SOAP_OPERATION_CONFIG_CACHE_SIZE)
def get_soap_operation_config(
    simpler_api: SimplerSoapAPI, request_operation_name: str
) -> SOAPOperationConfig | None:
    return SIMPLER_SOAP_OPERATION_CONFIGS.get(simpler_api, {}).get(request_operation_name)
