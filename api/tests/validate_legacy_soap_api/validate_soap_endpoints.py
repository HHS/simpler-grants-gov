import logging
import os
import re
import tempfile
import uuid
import zipfile
from collections.abc import Callable
from contextlib import ExitStack
from dataclasses import dataclass, field
from datetime import timedelta
from pathlib import Path
from urllib.parse import quote

import click
import grants_shared.adapters.db as db
import grants_shared.logs
import grants_shared.util.datetime_util as datetime_util
import requests
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
from grants_shared.adapters.db import PostgresDBClient
from grants_shared.util.local import error_if_not_local
from lxml import etree
from pydantic import Field
from sqlalchemy import select

import tests.src.db.models.factories as factories
from src.constants.lookup_constants import ApplicationStatus, Privilege
from src.db.models import staging
from src.db.models.agency_models import Agency
from src.db.models.competition_models import ApplicationSubmission
from src.db.models.user_models import LegacyCertificate
from src.util import file_util
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)
PRIVILEGES = {
    Privilege.LEGACY_AGENCY_VIEWER,
    Privilege.LEGACY_AGENCY_GRANT_RETRIEVER,
    Privilege.LEGACY_AGENCY_ASSIGNER,
}
UTC_NOW = datetime_util.utcnow()


"""
Add following to local.env
CERT_DATA =
KEY_DATA =
SOAP_URI =
SOAP_PARTNER_GATEWAY_URI=https://trainingws.grants.gov/
For cert and key use awk command to replace newlines
`awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;} bps_grantors.crt`
`awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;} bps_grantors.key`
May need to run `uv sync` to update command
To run use: `make validate-simpler-endpoints``
"""


class SOAPValidationEnvConfig(PydanticBaseEnvConfig):
    cert_data: str = Field(alias="CERT_DATA")
    key_data: str = Field(alias="KEY_DATA")
    soap_uri: str = Field(alias="SOAP_URI")


_config = SOAPValidationEnvConfig()

HEADERS = {"Content-Type": "application/xml", "Use-Simpler-Override": "1"}


@dataclass
class ValidateSoapContext:
    cert: str = field(init=False)
    key: str = field(init=False)
    stack: ExitStack
    db_session: db.Session

    def __post_init__(self) -> None:
        self.cert, self.key = get_credentials(self.stack)


def get_response(
    soap_context: ValidateSoapContext, request_operation: str, tracking_number: int
) -> requests.Response:
    cert = _config.cert_data.replace("\\n", "\n")
    encoded = quote(cert, safe="")
    headers = {"X-Amzn-Mtls-Clientcert": encoded, **HEADERS}
    data = REQUEST_BODY[request_operation](tracking_number)
    return requests.post(
        _config.soap_uri,
        data=data,
        headers=headers,
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


def get_grantors_get_application_zip_request_body(tracking_number: int) -> bytes:
    return (
        '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
        "<soapenv:Header/>"
        "<soapenv:Body>"
        "<agen:GetApplicationZipRequest>"
        f"<gran:GrantsGovTrackingNumber>GRANT{tracking_number}</gran:GrantsGovTrackingNumber>"
        "</agen:GetApplicationZipRequest>"
        "</soapenv:Body>"
        "</soapenv:Envelope>"
    ).encode("utf-8")


def get_grantors_get_submission_list_expanded_request_body(tracking_number: int) -> bytes:
    return f"""
        <soapenv:Envelope
        xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0"
        xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">
        <soapenv:Header/>
        <soapenv:Body>
        <agen:GetSubmissionListExpandedRequest>
            <gran:ExpandedApplicationFilter>
                <gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>
                <gran:FilterValue>GRANT{tracking_number}</gran:FilterValue>
             </gran:ExpandedApplicationFilter>
        </agen:GetSubmissionListExpandedRequest>
        </soapenv:Body>
        </soapenv:Envelope>
    """.encode()


def get_grantors_get_submission_list_request_body(tracking_number: int) -> bytes:
    return f"""
        <soapenv:Envelope
        xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0"
        xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">
        <soapenv:Header/>
        <soapenv:Body>
        <agen:GetSubmissionListRequest>
            <gran:ExpandedApplicationFilter>
                <gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>
                <gran:FilterValue>GRANT{tracking_number}</gran:FilterValue>
             </gran:ExpandedApplicationFilter>
        </agen:GetSubmissionListRequest>
        </soapenv:Body>
        </soapenv:Envelope>
    """.encode()


def get_grantors_get_confirm_application_delivery_body(tracking_number: int) -> bytes:
    return f"""
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">
        <soapenv:Header/>
        <soapenv:Body>
        <agen:ConfirmApplicationDeliveryRequest>
        <gran:GrantsGovTrackingNumber>GRANT{tracking_number}</gran:GrantsGovTrackingNumber>
        </agen:ConfirmApplicationDeliveryRequest>
        </soapenv:Body>
        </soapenv:Envelope>
    """.encode()


def get_update_application_info_body(tracking_number: int) -> bytes:
    return f"""
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0" xmlns:agen1="http://apply.grants.gov/system/AgencyUpdateApplicationInfo-V1.0">
        <soapenv:Header/>
        <soapenv:Body>
        <agen:UpdateApplicationInfoRequest>
        <gran:GrantsGovTrackingNumber>GRANT{tracking_number}</gran:GrantsGovTrackingNumber>
        <agen1:AssignAgencyTrackingNumber>TEST1234</agen1:AssignAgencyTrackingNumber>
        <agen1:SaveAgencyNotes>Test Note</agen1:SaveAgencyNotes>
        </agen:UpdateApplicationInfoRequest>
        </soapenv:Body>
        </soapenv:Envelope>
    """.encode()


REQUEST_BODY: dict[str, Callable[[int], bytes]] = {
    "GetSubmissionListExpandedRequest": get_grantors_get_submission_list_expanded_request_body,
    "GetSubmissionListRequest": get_grantors_get_submission_list_request_body,
    "GetApplicationZipRequest": get_grantors_get_application_zip_request_body,
    "ConfirmApplicationDeliveryRequest": get_grantors_get_confirm_application_delivery_body,
    "UpdateApplicationInfoRequest": get_update_application_info_body,
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
        temp_files["AgencyWebServices-V2.0.wsdl"], operation_response_name
    )
    schema_validator.assertValid(operation_element)


def clean_xml_namespaces(content: bytes) -> bytes:
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
    return content.replace(wrong_ns, right_ns)


def validate_grantors_get_application_zip_request(
    soap_context: ValidateSoapContext, legacy_tracking_number: int
) -> None:
    resp = get_response(soap_context, "GetApplicationZipRequest", legacy_tracking_number)
    assert resp.status_code == 200
    # The xml namespaces here do not need to be cleaned because there are no
    # blank namepsaces to default to the wrong url here
    validate_response_xml(resp.content, "GetApplicationZipResponse", soap_context)
    logger.info("Validation: GetApplicationZip is validated")


def validate_grantors_get_submission_list_expanded_request(
    soap_context: ValidateSoapContext, legacy_tracking_number: int
) -> None:
    resp = get_response(soap_context, "GetSubmissionListExpandedRequest", legacy_tracking_number)
    assert (
        f"<GrantsGovTrackingNumber>GRANT{legacy_tracking_number}</GrantsGovTrackingNumber>".encode()
        in resp.content
    )
    assert (
        b"<ns2:Success>true</ns2:Success><ns2:AvailableApplicationNumber>1</ns2:AvailableApplicationNumber>"
        in resp.content
    )
    assert resp.status_code == 200
    fixed_bytes = clean_xml_namespaces(resp.content)
    validate_response_xml(fixed_bytes, "GetSubmissionListExpandedResponse", soap_context)
    logger.info("Validation: GetSubmissionListExpanded is validated")


def validate_grantors_get_submission_list_request(
    soap_context: ValidateSoapContext, legacy_tracking_number: int
) -> None:
    resp = get_response(soap_context, "GetSubmissionListRequest", legacy_tracking_number)
    assert (
        f"<GrantsGovTrackingNumber>GRANT{legacy_tracking_number}</GrantsGovTrackingNumber>".encode()
        in resp.content
    )
    assert (
        b"<ns2:Success>true</ns2:Success><ns2:AvailableApplicationNumber>1</ns2:AvailableApplicationNumber>"
        in resp.content
    )
    assert resp.status_code == 200
    fixed_bytes = clean_xml_namespaces(resp.content)
    validate_response_xml(fixed_bytes, "GetSubmissionListResponse", soap_context)
    logger.info("Validation: GetSubmissionListResponse is validated")


def validate_confirm_application_delivery_request(
    soap_context: ValidateSoapContext, legacy_tracking_number
) -> None:
    resp = get_response(soap_context, "ConfirmApplicationDeliveryRequest", legacy_tracking_number)
    assert (
        f"<GrantsGovTrackingNumber>GRANT{legacy_tracking_number}</GrantsGovTrackingNumber>".encode()
        in resp.content
    )
    assert b"<ResponseMessage>Success</ResponseMessage>" in resp.content
    assert resp.status_code == 200
    fixed_bytes = clean_xml_namespaces(resp.content)
    validate_response_xml(fixed_bytes, "ConfirmApplicationDeliveryResponse", soap_context)
    logger.info("Validation: ConfirmApplicationDelivery is validated")


def validate_update_application_info_request(
    soap_context: ValidateSoapContext, legacy_tracking_number
) -> None:
    resp = get_response(soap_context, "UpdateApplicationInfoRequest", legacy_tracking_number)
    assert (
        f"<GrantsGovTrackingNumber>GRANT{legacy_tracking_number}</GrantsGovTrackingNumber>".encode()
        in resp.content
    )
    assert b"<ns2:Success>true</ns2:Success>" in resp.content
    assert resp.status_code == 200
    fixed_bytes = clean_xml_namespaces(resp.content)
    validate_response_xml(fixed_bytes, "UpdateApplicationInfoResponse", soap_context)
    logger.info("Validation: UpdateApplicationInfo is validated")


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


def create_private_key(path_key: Path) -> rsa.RSAPrivateKey:
    logger.info("creating private key & crt")
    key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    with open(path_key, "wb") as f:
        f.write(
            key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption(),
            )
        )
    return key


def create_cert(key: rsa.RSAPrivateKey, path_crt: Path) -> None:
    subject = issuer = x509.Name(
        [
            x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Oregon"),
            x509.NameAttribute(NameOID.LOCALITY_NAME, "Portland"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "My Company"),
            x509.NameAttribute(NameOID.COMMON_NAME, "example.com"),
        ]
    )
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(UTC_NOW)
        .not_valid_after(UTC_NOW + timedelta(days=365))
        .add_extension(
            x509.SubjectAlternativeName([x509.DNSName("example.com")]),
            critical=False,
        )
        .sign(key, algorithm=hashes.SHA256())
    )
    with open(path_crt, "wb") as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))


def setup_legacy_certificate(db_session: db.Session, agency: Agency, serial_number: str) -> None:
    legacy_certificate = db_session.scalar(
        select(LegacyCertificate).where(LegacyCertificate.serial_number == serial_number)
    )
    tcertificate = db_session.scalar(
        select(staging.certificates.Tcertificates).where(
            staging.certificates.Tcertificates.serial_num == serial_number
        )
    )
    stale_tcertificate = db_session.scalar(
        select(staging.certificates.Tcertificates).where(
            staging.certificates.Tcertificates.currentcertid == "9999"
        )
    )
    if legacy_certificate:
        db_session.delete(legacy_certificate)
    if tcertificate:
        db_session.delete(tcertificate)
    if stale_tcertificate:
        db_session.delete(stale_tcertificate)
    db_session.flush()
    tcertificate = factories.StagingTcertificatesFactory.create(
        agencyid=agency.agency_code,
        serial_num=serial_number,
        expirationdate=UTC_NOW.date() + timedelta(days=365),
        currentcertid=9999,
    )
    legacy_certificate = factories.LegacyAgencyCertificateFactory(
        agency_id=agency.agency_id,
        agency=agency,
        serial_number=tcertificate.serial_num,
        expiration_date=tcertificate.expirationdate,
    )
    agency_user = factories.AgencyUserFactory.create(agency=agency, user=legacy_certificate.user)
    role = factories.RoleFactory.create(privileges=PRIVILEGES, is_agency_role=True)
    factories.AgencyUserRoleFactory.create(agency_user=agency_user, role=role)
    db_session.add(legacy_certificate)


def _build_legacy_certificate_and_submission(
    db_session: db.Session, soap_context: ValidateSoapContext
) -> ApplicationSubmission:
    path_key = Path(soap_context.key)
    path_crt = Path(soap_context.cert)
    if path_key.exists() and path_crt.exists():
        logger.info("cert and key file exist")
    else:
        key = create_private_key(path_key)
        create_cert(key, path_crt)
    with open(path_crt, "rb") as f:
        cert_data = f.read()
    cert = x509.load_pem_x509_certificate(cert_data, default_backend())
    serial_number = format(cert.serial_number, "x")
    agency = factories.AgencyFactory.create()
    setup_legacy_certificate(db_session, agency, serial_number)
    opportunity = factories.OpportunityFactory.create(agency_code=agency.agency_code)
    competition = factories.CompetitionFactory.create(opportunity=opportunity)
    application = factories.ApplicationFactory.create(
        competition=competition, application_status=ApplicationStatus.ACCEPTED
    )
    s3_path = f"s3://local-mock-public-bucket/applications/{application.application_id}/submissions/{uuid.uuid4()}/submission.zip"
    with file_util.open_stream(s3_path, "wb") as outfile:
        with zipfile.ZipFile(outfile, "w") as submission_zip:

            # Create a dummy manifest file
            with submission_zip.open("manifest.txt", "w") as manifest_file:
                manifest_file.write(
                    f"Manifest for Grant Application {application.application_id}".encode("utf-8")
                )

            # Add a file for each application form
            # Note we make these text files as even a very simple
            # PDF is quite complex
            for app_form in application.application_forms:
                with submission_zip.open(f"{app_form.form.short_form_name}.txt", "w") as form_file:
                    form_file.write(str(app_form.application_response).encode("utf-8"))

            # Add some random attachments
            with submission_zip.open("dummy-attachment-1.txt", "w") as dummy_attachment:
                dummy_attachment.write(b"This is an attachment file")

            with submission_zip.open("dummy-attachment-2.txt", "w") as dummy_attachment:
                dummy_attachment.write(b"This is a different attachment file")

    return factories.ApplicationSubmissionFactory.create(
        application=application, file_location=s3_path, file_contents="SKIP"
    )


VALIDATIONS = [
    validate_grantors_get_application_zip_request,
    validate_grantors_get_submission_list_expanded_request,
    validate_grantors_get_submission_list_request,
    # Do ConfirmApplicationDelivery BEFORE UpdatApplicationInfo in order to get successful responses from both
    validate_confirm_application_delivery_request,
    validate_update_application_info_request,
]


@click.command()
def validate_simpler_endpoints() -> None:
    with ExitStack() as stack:
        stack.enter_context(grants_shared.logs.init("validate_simpler_endpoints"))
        logger.info("Running validation for SOAP endpoints")

        error_if_not_local()
        db_client = PostgresDBClient()
        db_session = stack.enter_context(db_client.get_session())
        soap_context = ValidateSoapContext(stack=stack, db_session=db_session)
        factories._db_session = db_session

        application_submission = _build_legacy_certificate_and_submission(db_session, soap_context)
        for validation in VALIDATIONS:
            test_name = validation.__name__
            try:
                validation(soap_context, application_submission.legacy_tracking_number)
                logger.info(f"{test_name} passed")
            except Exception as e:
                logger.exception(f"{test_name} failed: {e}")
