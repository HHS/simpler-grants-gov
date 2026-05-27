"""Factories for setting up data for specific scenarios

To help simplify setup when we need many factories repeatedly
with only a few alterations.
"""

import io
import uuid
from datetime import timedelta
from urllib import parse

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID

import src.util.datetime_util as datetime_util
from src.constants.lookup_constants import Privilege
from src.db.models.agency_models import Agency
from src.db.models.competition_models import ApplicationForm, Form
from src.db.models.user_models import Role, User
from src.legacy_soap_api.legacy_soap_api_auth import (
    LOG_LOCAL_RESPONSE_HEADER_KEY,
    SOAPAuth,
    SOAPClientCertificate,
)
from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI
from src.legacy_soap_api.legacy_soap_api_schemas.base import SOAPRequest, SoapRequestStreamer
from tests.src.db.models.factories import (
    AgencyFactory,
    AgencyUserFactory,
    AgencyUserRoleFactory,
    ApplicationAttachmentFactory,
    ApplicationFactory,
    ApplicationFormFactory,
    ApplicationUserFactory,
    CompetitionFactory,
    CompetitionFormFactory,
    LegacyAgencyCertificateFactory,
    LinkExternalUserFactory,
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
    OrganizationFactory,
    RoleFactory,
    StagingTcertificatesFactory,
    get_db_session,
)

DEFAULT_VALUE = object()


def _make_form(**kwargs) -> Form:
    defaults: dict = {
        "form_name": "Test form",
        "short_form_name": f"TST_{uuid.uuid4().hex[:8]}",
        "form_version": "1.0",
        "agency_code": "TEST",
        "form_json_schema": {},
        "form_ui_schema": [],
    }
    defaults.update(kwargs)
    form = Form(**defaults)
    db_session = get_db_session()
    db_session.add(form)
    db_session.flush()
    return form


def setup_application_for_form_validation(
    json_data: dict,
    json_schema: dict,
    rule_schema: dict | None,
    # These are various params that be set in the application
    # if the value is None, we'll just leave it to the factory to set.
    opportunity_number: str | None = DEFAULT_VALUE,
    opportunity_title: str | None = DEFAULT_VALUE,
    has_agency: bool = True,
    agency_name: str | None = DEFAULT_VALUE,
    agency_code: str | None = None,
    user_email: str | None = None,
    attachment_ids: list[str] | None = None,
    deleted_attachment_ids: list[str] | None = None,
    has_organization: bool = False,
    uei: str | None = None,
    has_assistance_listing_number: bool = True,
    assistance_listing_number: str | None = None,
    assistance_listing_program_title: str | None = None,
    public_competition_id: str | None = None,
    competition_title: str | None = None,
) -> ApplicationForm:
    opp_params = {}
    agency_params = {}
    if has_agency:
        if agency_name is not DEFAULT_VALUE:
            agency_params["agency_name"] = agency_name
        agency = AgencyFactory.create(**agency_params)
        opp_params["agency_code"] = agency.agency_code
    else:
        opp_params["agency_code"] = agency_code

    if opportunity_number is not DEFAULT_VALUE:
        opp_params["opportunity_number"] = opportunity_number
    if opportunity_title is not DEFAULT_VALUE:
        opp_params["opportunity_title"] = opportunity_title

    opportunity = OpportunityFactory.create(**opp_params)

    opportunity_assistance_listing = None
    if has_assistance_listing_number:
        params = {
            "opportunity": opportunity,
            "assistance_listing_number": assistance_listing_number,
            "program_title": assistance_listing_program_title,
        }
        opportunity_assistance_listing = OpportunityAssistanceListingFactory.create(**params)

    competition_params = {
        "opportunity": opportunity,
        "competition_forms": [],
        "competition_title": competition_title,
        "public_competition_id": public_competition_id,
        "opportunity_assistance_listing": opportunity_assistance_listing,
    }

    competition = CompetitionFactory.create(**competition_params)
    form = _make_form(form_json_schema=json_schema, form_rule_schema=rule_schema)
    competition_form = CompetitionFormFactory.create(competition=competition, form=form)

    organization = None
    if has_organization:
        organization_params = {}
        if uei is not None:
            organization_params["sam_gov_entity__uei"] = uei
        else:
            organization_params["sam_gov_entity"] = None
        organization = OrganizationFactory(**organization_params)

    application = ApplicationFactory.create(competition=competition, organization=organization)
    application_form = ApplicationFormFactory.create(
        application=application, competition_form=competition_form, application_response=json_data
    )

    if attachment_ids is not None:
        for attachment_id in attachment_ids:
            ApplicationAttachmentFactory.create(
                application_attachment_id=attachment_id, application=application
            )
    if deleted_attachment_ids is not None:
        for attachment_id in deleted_attachment_ids:
            ApplicationAttachmentFactory.create(
                application_attachment_id=attachment_id, application=application, is_deleted=True
            )

    if user_email is not None:
        app_user = ApplicationUserFactory.create(application=application)
        LinkExternalUserFactory.create(email=user_email, user=app_user.user)
        application.submitted_by_user = app_user.user

    return application_form


def get_mtls_urlencoded_str_and_serial_number():
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
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
        .not_valid_before(datetime_util.utcnow())
        .not_valid_after(datetime_util.utcnow() + timedelta(days=365))
        .add_extension(
            x509.SubjectAlternativeName([x509.DNSName("example.com")]),
            critical=False,
        )
        .sign(key, algorithm=hashes.SHA256())
    )
    serial_number = hex(cert.serial_number).lower().lstrip("0x")
    pem_bytes = cert.public_bytes(serialization.Encoding.PEM)
    return parse.quote(pem_bytes), serial_number


def setup_cert_user(
    agency: Agency, privileges: list | set
) -> tuple[User, Role, SOAPClientCertificate, str]:
    mtls_cert, serial_number = get_mtls_urlencoded_str_and_serial_number()
    tcertificate = StagingTcertificatesFactory.create(serial_num=serial_number)
    legacy_certificate = LegacyAgencyCertificateFactory.create(
        agency=agency,
        serial_number=serial_number,
        cert_id=tcertificate.currentcertid,
        expiration_date=tcertificate.expirationdate,
    )
    agency_user = AgencyUserFactory.create(agency=agency, user=legacy_certificate.user)
    role = RoleFactory.create(privileges=privileges, is_agency_role=True)
    AgencyUserRoleFactory.create(agency_user=agency_user, role=role)
    soap_client_certificate = SOAPClientCertificate(
        serial_number=legacy_certificate.serial_number,
        cert="123",
        fingerprint="456",
        legacy_certificate=legacy_certificate,
        cert_id=legacy_certificate.cert_id,
    )
    return legacy_certificate.user, role, soap_client_certificate, mtls_cert


def create_soap_request(
    soap_payload: bytes,
    log_local: bool = False,
    operation_name: str = "GetApplicationZipRequest",
    full_path="/grantsws-agency/services/v2/AgencyWebServicesSoapPort",
    api_name=SimplerSoapAPI.GRANTORS,
) -> SOAPRequest:
    _, _, soap_certificate, _ = setup_cert_user(
        AgencyFactory.create(), [Privilege.LEGACY_AGENCY_VIEWER]
    )
    headers = {
        "X-Gg-S2S-Uri": "https://google.com/xyz",
    }
    if log_local:
        headers.update({f"{LOG_LOCAL_RESPONSE_HEADER_KEY}": "1"})
    return SOAPRequest(
        api_name=api_name,
        headers=headers,
        data=SoapRequestStreamer(stream=io.BytesIO(soap_payload)),
        full_path=full_path,
        method="POST",
        auth=SOAPAuth(certificate=soap_certificate),
        operation_name=operation_name,
    )
