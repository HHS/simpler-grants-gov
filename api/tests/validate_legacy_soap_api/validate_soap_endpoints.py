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

import src.adapters.db as db
import src.logging
import tests.src.db.models.factories as factories
from src.adapters.db import PostgresDBClient
from src.util.local import error_if_not_local

logger = logging.getLogger(__name__)


"""
Add following to soap-api.env
CERT_DATA =
KEY_DATA =
SOAP_URI =
For cert and key use awk command to replace newlines
`awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;} bps_grantors.crt`
`awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;} bps_grantors.key`
May need to run `poetry install` to update command
To run use: `make validate-simpler-endpoints``
"""

SOAP_URI = os.getenv(
    "SOAP_URI",
    b"http://host.docker.internal:8080/grantsws-agency/services/v2/AgencyWebServicesSoapPort",
)
HEADERS = {"Content-Type": "application/xml", "Use-Simpler-Override": "1", "Use-Soap-Cert": "1"}


@dataclass
class ValidateSoapContext:
    cert: str = field(init=False)
    key: str = field(init=False)
    stack: ExitStack
    db_session: db.Session

    def __post_init__(self) -> None:
        self.cert, self.key = get_credentials(self.stack)


def get_temp_files(stack: ExitStack) -> dict:
    dependencies = {
        "AgencyWebServices-V2.0": "https://ws07.grants.gov/grantsws-agency/services/v2/AgencyWebServicesSoapPort?wsdl"
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


def get_grantors_get_application_zip_request_data(gov_grants_tracking_number: str) -> bytes:
    return (
        '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
        "<soapenv:Header/>"
        "<soapenv:Body>"
        "<agen:GetApplicationZipRequest>"
        f"<gran:GrantsGovTrackingNumber>{gov_grants_tracking_number}</gran:GrantsGovTrackingNumber>"
        "</agen:GetApplicationZipRequest>"
        "</soapenv:Body>"
        "</soapenv:Envelope>"
    ).encode("utf-8")


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


def validate_grantors_get_application_zip_request(soap_context: ValidateSoapContext) -> None:
    cert = os.getenv("CERT_DATA", "")
    encoded = quote(cert, safe="")
    HEADERS.update({"X-Amzn-Mtls-Clientcert": encoded})
    data = get_grantors_get_application_zip_request_data("GRANT80000000")

    # Adding the cert to the headers and the cert kwarg in order to make this work if you call locally or call a lower env
    resp = requests.post(
        SOAP_URI, data=data, headers=HEADERS, cert=(soap_context.cert, soap_context.key)
    )
    simpler_match = re.search(rb"<soap:Envelope.*</soap:Envelope>", resp.content, re.DOTALL)
    if simpler_match is None:
        raise Exception("Envelope not found")
    xml_tree = etree.fromstring(simpler_match.group(0))
    ns = {
        "ns12": "http://schemas.xmlsoap.org/wsdl/soap/",
        "ns11": "http://schemas.xmlsoap.org/wsdl/",
        "ns10": "http://apply.grants.gov/system/GrantsFundingSynopsis-V2.0",
        "ns9": "http://apply.grants.gov/system/AgencyUpdateApplicationInfo-V1.0",
        "ns8": "http://apply.grants.gov/system/GrantsForecastSynopsis-V1.0",
        "ns7": "http://apply.grants.gov/system/AgencyManagePackage-V1.0",
        "ns6": "http://apply.grants.gov/system/GrantsPackage-V1.0",
        "ns5": "http://apply.grants.gov/system/GrantsOpportunity-V1.0",
        "ns4": "http://apply.grants.gov/system/GrantsRelatedDocument-V1.0",
        "ns3": "http://apply.grants.gov/system/GrantsTemplate-V1.0",
        "ns2": "http://apply.grants.gov/services/AgencyWebServices-V2.0",
        "soap": "http://schemas.xmlsoap.org/soap/envelope/",
        "xop": "http://www.w3.org/2004/08/xop/include",
    }
    operation_element = xml_tree.xpath("//ns2:GetApplicationZipResponse", namespaces=ns)[0]

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
        temp_files["AgencyWebServices-V2.0"], "GetApplicationZipResponse"
    )
    schema_validator.assertValid(operation_element)
    print("Validation: GetApplicationZip Passed")


def get_credentials(stack: ExitStack) -> tuple:
    cert_data_encoded = os.getenv("CERT_DATA")
    key_data_encoded = os.getenv("KEY_DATA")
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
