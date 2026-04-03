import logging
import os
import re
import tempfile
from contextlib import ExitStack
from dataclasses import dataclass, field
from urllib.parse import quote

import click
import requests
from lxml import etree
from pydantic import Field

import src.adapters.db as db
import src.logging
import tests.src.db.models.factories as factories
from src.adapters.db import PostgresDBClient
from src.util.env_config import PydanticBaseEnvConfig
from src.util.local import error_if_not_local

logger = logging.getLogger(__name__)


"""
Add following to local.env
CERT_DATA =
KEY_DATA =
SOAP_URI =
For cert and key use awk command to replace newlines
`awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;} bps_grantors.crt`
`awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;} bps_grantors.key`
May need to run `poetry install` to update command
To run use: `make validate-simpler-endpoints``
"""


class SOAPValidationEnvConfig(PydanticBaseEnvConfig):
    cert_data: str = Field(alias="CERT_DATA")
    key_data: str = Field(alias="KEY_DATA")
    soap_uri: str = Field(alias="SOAP_URI")


_config = SOAPValidationEnvConfig()

HEADERS = {"Content-Type": "application/xml", "Use-Simpler-Override": "1", "Use-Soap-Cert": "1"}


@dataclass
class ValidateSoapContext:
    cert: str = field(init=False)
    key: str = field(init=False)
    stack: ExitStack
    db_session: db.Session

    def __post_init__(self) -> None:
        self.cert, self.key = get_credentials(self.stack)


def get_response(soap_context: ValidateSoapContext, request_operation: str) -> requests.Response:
    cert = _config.cert_data
    encoded = quote(cert, safe="")
    HEADERS.update({"X-Amzn-Mtls-Clientcert": encoded})
    data = REQUEST_BODY[request_operation]
    return requests.post(
        _config.soap_uri,
        data=data,
        headers=HEADERS,
        cert=(soap_context.cert, soap_context.key),
        timeout=10,
    )


def get_temp_files(stack: ExitStack) -> dict:
    # Training Environment wsdl: https://trainingws.grants.gov/grantsws-agency/services/v2/AgencyWebServicesSoapPort?wsdl
    # Production Environment wsdl: https://ws07.grants.gov/grantsws-agency/services/v2/AgencyWebServicesSoapPort?wsdl
    # see: https://www.grants.gov/system-to-system/grantor-system-to-system/versions-wsdls
    dependencies = {
        "AgencyWebServices-V2.0.wsdl": "https://ws07.grants.gov/grantsws-agency/services/v2/AgencyWebServicesSoapPort?wsdl",
    }
    temp_files = {}
    for key, url in dependencies.items():
        filepath = f"/api/tests/validate_legacy_soap_api/cache/{key}"
        if not os.path.isfile(filepath):
            f = stack.enter_context(open(filepath, mode="wb"))
            response = requests.get(url=url, timeout=10)
            f.write(response.content)
            f.flush()
        temp_files[key] = f"/api/tests/validate_legacy_soap_api/cache/{key}"
    return temp_files


def get_grantors_get_application_zip_request_body() -> bytes:
    return (
        '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
        "<soapenv:Header/>"
        "<soapenv:Body>"
        "<agen:GetApplicationZipRequest>"
        "<gran:GrantsGovTrackingNumber>GRANT80000000</gran:GrantsGovTrackingNumber>"
        "</agen:GetApplicationZipRequest>"
        "</soapenv:Body>"
        "</soapenv:Envelope>"
    ).encode("utf-8")


def get_grantors_get_submission_list_expanded_request_body() -> bytes:
    return """
        <soapenv:Envelope
        xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0"
        xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">
        <soapenv:Header/>
        <soapenv:Body>
        <agen:GetSubmissionListExpandedRequest>
        </agen:GetSubmissionListExpandedRequest>
        </soapenv:Body>
        </soapenv:Envelope>
    """.encode()


REQUEST_BODY = {
    "GetSubmissionListRequest": get_grantors_get_submission_list_expanded_request_body(),
    "GetApplicationZipRequest": get_grantors_get_application_zip_request_body(),
}


def build_schema_validator(wsdl_path: str, operation_name: str) -> etree.XMLSchema:
    wsdl_tree = etree.parse(wsdl_path)
    xs_ns = {"xs": "http://www.w3.org/2001/XMLSchema"}

    all_schemas = wsdl_tree.xpath("//xs:schema", namespaces=xs_ns)

    main_schema_element = None
    for schema in all_schemas:
        check = schema.xpath(f"./xs:element[@name='{operation_name}']", namespaces=xs_ns)
        if check:
            main_schema_element = schema
            break

    if main_schema_element is None:
        raise ValueError(f"Could not find global element '{operation_name}' in WSDL")

    # Setting these schemaLocation tells the parser where to look for the data which then directs it to the MemoryResolver
    for imp in main_schema_element.xpath("//xs:import", namespaces=xs_ns):
        ns_uri = imp.get("namespace")
        if ns_uri:
            imp.set("schemaLocation", ns_uri)

    schema_map = {s.get("targetNamespace"): s for s in all_schemas if s.get("targetNamespace")}

    # This prevents the parser from trying ot find the data locally or on the internet but use the schema_map instead
    class MemoryResolver(etree.Resolver):
        def resolve(self, url: str, pubid: str, context: etree._ParserContext) -> str | None:
            if url in schema_map:
                return self.resolve_string(etree.tostring(schema_map[url]), context)
            return None

    parser = etree.XMLParser()
    parser.resolvers.add(MemoryResolver())
    schema_string = etree.tostring(main_schema_element)
    schema_root = etree.fromstring(schema_string, parser=parser)
    return etree.XMLSchema(schema_root)


def validate_response_xml(
    response_bytes: bytes, operation_response_name: str, soap_context: ValidateSoapContext
) -> None:
    simpler_match = re.search(rb"<soap:Envelope.*</soap:Envelope>", response_bytes, re.DOTALL)
    if simpler_match is None:
        raise Exception("Envelope not found")
    xml_tree = etree.fromstring(simpler_match.group(0))
    ns = {
        "xop": "http://www.w3.org/2004/08/xop/include",
        "soap": "http://schemas.xmlsoap.org/soap/envelope/",
        "ns2": "http://apply.grants.gov/services/AgencyWebServices-V2.0",
        "ns3": "http://apply.grants.gov/system/GrantsTemplate-V1.0",
        "ns4": "http://apply.grants.gov/system/GrantsRelatedDocument-V1.0",
        "ns5": "http://apply.grants.gov/system/GrantsOpportunity-V1.0",
        "ns6": "http://apply.grants.gov/system/GrantsPackage-V1.0",
        "ns7": "http://apply.grants.gov/system/AgencyManagePackage-V1.0",
        "ns8": "http://apply.grants.gov/system/GrantsForecastSynopsis-V1.0",
        "ns9": "http://apply.grants.gov/system/AgencyUpdateApplicationInfo-V1.0",
        "ns10": "http://apply.grants.gov/system/GrantsFundingSynopsis-V2.0",
        "ns11": "http://schemas.xmlsoap.org/wsdl/",
        "ns12": "http://schemas.xmlsoap.org/wsdl/soap/",
    }
    operation_element = xml_tree.xpath(f"//ns2:{operation_response_name}", namespaces=ns)[0]
    # XOP element removed due to it being a pointer to where data is stored not part of a model defined in the xsd
    file_handler_elements = operation_element.findall(
        ".//ns2:FileDataHandler",
        namespaces=ns,
    )
    for handler in file_handler_elements:
        xop_include = handler.find("xop:Include", namespaces=ns)
        handler.remove(xop_include)
        handler.text = None
    # This step is defensive in case that extracting the GetApplicationZipResponse breaks namespace connections
    etree.cleanup_namespaces(operation_element)
    temp_files = get_temp_files(soap_context.stack)
    schema_validator = build_schema_validator(
        temp_files["AgencyWebServices-V2.0.wsdl"], f"{operation_response_name}"
    )
    schema_validator.assertValid(operation_element)


def validate_grantors_get_application_zip_request(soap_context: ValidateSoapContext) -> None:
    resp = get_response(soap_context, "GetApplicationZipRequest")
    assert resp.status_code == 200
    validate_response_xml(resp.content, "GetApplicationZipResponse", soap_context)
    print("Validation: GetApplicationZip is validated")


def validate_grantors_get_submission_list_expanded_request(
    soap_context: ValidateSoapContext,
) -> None:
    resp = get_response(soap_context, "GetSubmissionListRequest")
    assert resp.status_code == 200
    # The incoming xml namespaces conflict with the wsdl settings.
    # According to the wsdl, due to the elementFormDetail = qualified,
    # the default namespace for elements without an explicit namespace should be associated with the
    # TargetNamespace (tns prefix) which is AgencyWebServices, not CommonElements.
    # See wsdl:
    # xmlns:tns="http://apply.grants.gov/services/AgencyWebServices-V2.0"
    # The original (wrong) namespace
    wrong_ns = b'xmlns="http://apply.grants.gov/system/GrantsCommonElements-V1.0"'
    # The expected (correct) namespace
    right_ns = b'xmlns="http://apply.grants.gov/services/AgencyWebServices-V2.0"'
    fixed_bytes = resp.content.replace(wrong_ns, right_ns)
    validate_response_xml(fixed_bytes, "GetSubmissionListExpandedResponse", soap_context)
    print("Validation: GetSubmissionListExpanded is validated")


def get_credentials(stack: ExitStack) -> tuple:
    cert_data_encoded = _config.cert_data
    key_data_encoded = _config.key_data
    if cert_data_encoded and key_data_encoded:
        cert_data = cert_data_encoded.replace("\\n", "\n")
        key_data = key_data_encoded.replace("\\n", "\n")
    else:
        raise Exception("No cert data")

    temp_cert_file = stack.enter_context(tempfile.NamedTemporaryFile(delete=True, mode="wb"))
    temp_cert_file.write(cert_data.encode("utf-8"))
    temp_cert_file.flush()
    cert = temp_cert_file.name

    temp_key_file = stack.enter_context(tempfile.NamedTemporaryFile(delete=True, mode="wb"))
    temp_key_file.write(key_data.encode("utf-8"))
    temp_key_file.flush()
    key = temp_key_file.name

    return cert, key


VALIDATIONS = [
    validate_grantors_get_application_zip_request,
    validate_grantors_get_submission_list_expanded_request,
]


@click.command()
def validate_simpler_endpoints() -> None:
    with ExitStack() as stack:
        stack.enter_context(src.logging.init("validate_simpler_endpoints"))
        logger.info("Running validation for SOAP endpoints")

        error_if_not_local()
        db_client = PostgresDBClient()
        db_session = stack.enter_context(db_client.get_session())
        soap_context = ValidateSoapContext(stack=stack, db_session=db_session)
        factories._db_session = db_session
        for validation in VALIDATIONS:
            test_name = validation.__name__
            try:
                validation(soap_context)
                logger.info(f"{test_name} passed")
            except Exception as e:
                logger.exception(f"{test_name} failed: {e}")
