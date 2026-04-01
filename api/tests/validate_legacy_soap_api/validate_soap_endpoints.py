import io
import logging
import os
import re
import tempfile
from contextlib import ExitStack
from dataclasses import dataclass, field

import click
import requests
from lxml import etree

import src.adapters.db as db
import src.logging
import tests.src.db.models.factories as factories
from src.adapters.db import PostgresDBClient
from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI
from src.legacy_soap_api.legacy_soap_api_schemas.base import SOAPRequest, SoapRequestStreamer
from src.legacy_soap_api.legacy_soap_api_utils import get_alternate_proxy_response
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


SOAP_URI = os.getenv("SOAP_URI", b"")
HEADERS = {"Content-Type": "application/xml"}


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
        "GrantsFundingSynopsis-V2.0": "https://trainingapply.grants.gov/apply/system/schemas/GrantsFundingSynopsis-V2.0.xsd",
        "GrantsCommonElements-V1.0": "https://trainingapply.grants.gov/apply/system/schemas/GrantsCommonElements-V1.0.xsd",
        "GrantsCommonTypes-V1.0": "https://trainingapply.grants.gov/apply/system/schemas/GrantsCommonTypes-V1.0.xsd",
        "GrantsOpportunity-V1.0": "https://trainingapply.grants.gov/apply/system/schemas/GrantsOpportunity-V1.0.xsd",
        "GrantsForecastSynopsis-V1.0": "https://trainingapply.grants.gov/apply/system/schemas/GrantsForecastSynopsis-V1.0.xsd",
        "GrantsPackage-V1.0": "https://trainingapply.grants.gov/apply/system/schemas/GrantsPackage-V1.0.xsd",
        "GrantsTemplate-V1.0": "https://trainingapply.grants.gov/apply/system/schemas/GrantsTemplate-V1.0.xsd",
        "GrantsRelatedDocument-V1.0": "https://trainingapply.grants.gov/apply/system/schemas/GrantsRelatedDocument-V1.0.xsd",
        "AgencyManagePackage-V1.0": "https://trainingapply.grants.gov/apply/system/schemas/AgencyManagePackage-V1.0.xsd",
        "AgencyUpdateApplicationInfo-V1.0": "https://trainingapply.grants.gov/apply/system/schemas/AgencyUpdateApplicationInfo-V1.0.xsd",
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


def get_xml_schema_bytes(temp_files: dict, soap_context: ValidateSoapContext) -> bytes:
    TARGET_URI = "http://apply.grants.gov/services/AgencyWebServices-V2.0"
    filepath = "/api/tests/validate_legacy_soap_api/cache/AgencyWebServices-V2.0"
    f = soap_context.stack.enter_context(open(filepath, "rb"))
    wsdl_root = etree.fromstring(f.read())
    NS = {"wsdl": "http://schemas.xmlsoap.org/wsdl/", "xs": "http://www.w3.org/2001/XMLSchema"}
    schema_xpath_query = f".//xs:schema[@targetNamespace='{TARGET_URI}']"
    schema = wsdl_root.find(schema_xpath_query, namespaces=NS)
    import_xpath_query = "./xs:import"
    import_elements = schema.findall(import_xpath_query, namespaces=NS)
    for import_elem in import_elements:
        target_name = import_elem.get("namespace")
        filename_from_url = os.path.basename(target_name)
        if filename_from_url in temp_files:
            import_elem.set("schemaLocation", temp_files[filename_from_url])
    return etree.tostring(schema)


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


def validate_grantor_get_application_zip_request_not_found(
    soap_context: ValidateSoapContext,
) -> None:
    """
    Get legacy xml
    """
    legacy_tracking_number = "GRANT60000001"
    legacy_resp = requests.post(
        SOAP_URI,
        data=get_grantors_get_application_zip_request_data(legacy_tracking_number),
        headers=HEADERS,
        cert=(soap_context.cert, soap_context.key),
        timeout=10,
    )
    assert legacy_resp.status_code == 500
    legacy_match = re.search(
        r"<soap:Envelope.*</soap:Envelope>", legacy_resp.content.decode(), re.DOTALL
    )
    if not legacy_match:
        raise Exception("No legacy response")

    """
    Get xml from simpler
    """
    simpler_tracking_number = "GRANT80000001"
    soap_request = SOAPRequest(
        api_name=SimplerSoapAPI.GRANTORS,
        method="POST",
        full_path=SOAP_URI,
        headers=HEADERS,
        data=SoapRequestStreamer(
            stream=io.BytesIO(
                get_grantors_get_application_zip_request_data(simpler_tracking_number)
            )
        ),
        operation_name="GetApplicationZipRequest",
    )
    simpler_resp = get_alternate_proxy_response(soap_request)
    if simpler_resp is None:
        raise Exception("No simpler response found")
    simpler_xml_response = simpler_resp.to_flask_response()[0]
    simpler_match = re.search(
        r"<soap:Envelope.*</soap:Envelope>", simpler_xml_response.decode(), re.DOTALL
    )
    if not simpler_match:
        raise Exception("No xml found")

    """
    Compare the cleaned xml output from the legacy endpoint to the cleaned xml generated by simpler
    """
    pattern = r"tracking number:(.*?)\)"
    simpler_xml = simpler_match.group(0)
    legacy_xml = legacy_match.group(0)
    cleaned_legacy = re.sub(pattern, "tracking number:", legacy_xml, flags=re.DOTALL)
    cleaned_simpler = re.sub(pattern, "tracking number:", simpler_xml, flags=re.DOTALL)
    assert cleaned_legacy == cleaned_simpler


def build_schema_validator(wsdl_path: str, operation_name: str) -> etree.XMLSchema:
    wsdl_tree = etree.parse(wsdl_path)
    xs_ns = {'xs': 'http://www.w3.org/2001/XMLSchema'}

    all_schemas = wsdl_tree.xpath("//xs:schema", namespaces=xs_ns)
    schema_map = {s.get("targetNamespace"): s for s in all_schemas if s.get("targetNamespace")}

    main_schema_element = None
    for schema in all_schemas:
        check = schema.xpath(f"./xs:element[@name='{operation_name}']", namespaces=xs_ns)
        if check:
            main_schema_element = schema
            break

    if main_schema_element is None:
        raise ValueError(f"Could not find global element '{operation_name}' in WSDL")

    class MemoryResolver(etree.Resolver):
        def resolve(self, url: str, pubid: str, context):
            if url in schema_map:
                return self.resolve_string(etree.tostring(schema_map[url]), context)
            ns_config = {
               "xsd": "http://www.w3.org/2001/XMLSchema",
               "ns0": "http://schemas.xmlsoap.org/wsdl/soap/",
               "ns1": "http://schemas.xmlsoap.org/wsdl/",
               "ns2": "http://apply.grants.gov/system/GrantsTemplate-V1.0",
               "ns3": "http://apply.grants.gov/system/GrantsRelatedDocument-V1.0",
               "ns4": "http://apply.grants.gov/system/GrantsPackage-V1.0",
               "ns5": "http://apply.grants.gov/system/GrantsOpportunity-V1.0",
               "ns6": "http://apply.grants.gov/system/GrantsFundingSynopsis-V2.0",
               "ns7": "http://apply.grants.gov/system/GrantsForecastSynopsis-V1.0",
               "ns8": "http://apply.grants.gov/system/GrantsCommonTypes-V1.0",
               "ns9": "http://apply.grants.gov/system/GrantsCommonElements-V1.0",
               "ns10": "http://apply.grants.gov/system/AgencyUpdateApplicationInfo-V1.0",
               "ns11": "http://apply.grants.gov/system/AgencyManagePackage-V1.0",
               "ns12": "http://apply.grants.gov/services/AgencyWebServices-V2.0"
            }
            for nickname, uri in ns_config.items():
                if (url == nickname or url == uri) and uri in schema_map:
                    return self.resolve_string(etree.tostring(schema_map[uri]), context)
            return None

    parser = etree.XMLParser()
    parser.resolvers.add(MemoryResolver())

    for imp in main_schema_element.xpath("//xs:import", namespaces=xs_ns):
        ns_uri = imp.get("namespace")
        if ns_uri:
            imp.set("schemaLocation", ns_uri)

    schema_string = etree.tostring(main_schema_element)
    schema_root = etree.fromstring(schema_string, parser=parser)
    return etree.XMLSchema(schema_root)


def validate_grantors_get_application_zip_request(soap_context: ValidateSoapContext) -> None:
    url = "http://host.docker.internal:8080/grantsws-agency/services/v2/AgencyWebServicesSoapPort"
    cert = ''  # get the url encoded cert string from seed-local-soap-certificate
    headers = {"Use-Soap-Cert": "1", "X-Amzn-Mtls-Clientcert": cert}
    data = get_grantors_get_application_zip_request_data("GRANT80000000")
    resp = requests.post(url, data=data, headers=headers)

    simpler_match = re.search(rb"<soap:Envelope.*</soap:Envelope>", resp.content, re.DOTALL)
    if simpler_match is None:
        print("Failed to find a valid soap envelope")
        return
    xml_tree = etree.fromstring(simpler_match.group(0))
    ns = {
        "soap": "http://schemas.xmlsoap.org/soap/envelope/",
        "ns2": "http://apply.grants.gov/services/AgencyWebServices-V2.0",
        "xop": "http://www.w3.org/2004/08/xop/include"
    }
    operation_element = xml_tree.xpath("//ns2:GetApplicationZipResponse", namespaces=ns)[0]

    # XOP element removed due to it being a pointer to where data is stored not part of a model defined in the xsd
    NS_XOP = {"xop": "http://www.w3.org/2004/08/xop/include"}
    file_handler_elements = operation_element.findall(
        ".//ns:FileDataHandler",
        namespaces={"ns": "http://apply.grants.gov/services/AgencyWebServices-V2.0"},
    )
    for handler in file_handler_elements:
        xop_include = handler.find("xop:Include", namespaces=NS_XOP)
        handler.remove(xop_include)
        handler.text = None

    temp_files = get_temp_files(soap_context.stack)

    schema_validator = build_schema_validator(temp_files["AgencyWebServices-V2.0"], "GetApplicationZipResponse")

    etree.cleanup_namespaces(operation_element)
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
    # validate_grantor_get_application_zip_request_not_found,
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
