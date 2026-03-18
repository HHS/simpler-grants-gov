import datetime
import logging
import uuid
from datetime import timedelta
from pathlib import Path
from urllib.parse import quote

from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
from sqlalchemy import exists, select

import src.adapters.db as db
import tests.src.db.models.factories as factories
from src.constants.lookup_constants import ApplicationStatus, Privilege
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import LegacyCertificate

logger = logging.getLogger(__name__)
CURRENT_DIR = Path(__file__).parent
TARGET_DIR = CURRENT_DIR / "cache"
PRIVILEGES = {
    Privilege.LEGACY_AGENCY_VIEWER,
    Privilege.LEGACY_AGENCY_GRANT_RETRIEVER,
    Privilege.LEGACY_AGENCY_ASSIGNER,
}
AGENCY_INFO = {
    "agency_code": "SOAP",
    "agency_id": "c8e8f2b4-0f3c-4e7e-9a4a-1e6c2b8c9d12",
    "agency_name": "SOAP Test Agency",
}


def create_private_key():
    path_key = Path(f"{TARGET_DIR}/local.key")
    path_crt = Path(f"{TARGET_DIR}/local.crt")

    if path_key.exists() and path_crt.exists():
        print("private key & crt exists")
        return
    else:
        print("creating private key & crt")
    key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    with open(f"{TARGET_DIR}/local.key", "wb") as f:
        f.write(
            key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption(),
            )
        )
    return key


def create_cert(key) -> None:
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
        .not_valid_before(datetime.datetime.now(datetime.UTC))
        .not_valid_after(datetime.datetime.now(datetime.UTC) + timedelta(days=365))
        .add_extension(
            x509.SubjectAlternativeName([x509.DNSName("example.com")]),
            critical=False,
        )
        .sign(key, algorithm=hashes.SHA256())
    )
    with open(f"{TARGET_DIR}/local.crt", "wb") as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))


def get_or_create_agency(db_session):
    stmt = select(exists().where(Agency.agency_code == AGENCY_INFO["agency_code"]))
    agency_exists = db_session.execute(stmt).first()[0]
    if not agency_exists:
        logger.info("Creating agency in agency table")
        return factories.AgencyFactory.create(**AGENCY_INFO)
    else:
        logger.info("Test agency already exists")
        return db_session.execute(
            select(Agency).where(Agency.agency_id == AGENCY_INFO["agency_id"])
        ).scalar()


def create_opportunity(db_session, agency):
    # Due to issues with agency being overridden an Opportunity is created without a factory
    opportunity = Opportunity(
        opportunity_number=f"{uuid.uuid4()}",
        opportunity_title="TEST SOAP OPPORTUNITY",
        agency_code=agency.agency_code,
        is_draft=False,
    )
    opportunity.agency_record = agency
    return opportunity


def get_or_create_legacy_certificate(db_session, agency, serial_number):
    stmt = select(exists().where(LegacyCertificate.serial_number == serial_number))
    certificate_check = db_session.execute(stmt).first()
    legacy_certificate_exists = certificate_check[0] if certificate_check else None
    if not legacy_certificate_exists:
        user = factories.UserFactory()
        # Due to issues with agency being overridden the LegacyCertificate is created without a factory
        legacy_certificate = LegacyCertificate(
            user=user,
            agency_id=agency.agency_id,
            serial_number=serial_number,
            cert_id=str(int(serial_number, 16)),
            expiration_date=datetime.datetime.now(datetime.UTC).date() + timedelta(days=365),
        )
        agency_user = factories.AgencyUserFactory.create(
            agency=agency, user=legacy_certificate.user
        )
        role = factories.RoleFactory.create(privileges=PRIVILEGES, is_agency_role=True)
        factories.AgencyUserRoleFactory.create(agency_user=agency_user, role=role)
        db_session.add(legacy_certificate)
        logger.info("Test legacy_certificate created")
    else:
        legacy_certificate = db_session.execute(
            select(LegacyCertificate).where(LegacyCertificate.agency_id == agency.agency_id)
        ).scalar()
        logger.info("Test legacy_certificate already exists")


# This method creates a cert and key if it cannot find them in the cache
# it then gets or creates an agency with an agency_code of 'SOAP'
# then it creates an opportunity -> competition -> application -> application_submission
# then it gets or creates a legacy _certificate for that agency and cert serial_number
# it prints off the encoded cert that can be put into the Postman header
# in order to hit the locally running instance
def _build_legacy_certificate_and_submission(db_session: db.Session) -> None:
    key = create_private_key()
    if key:
        create_cert(key)
    with open(f"{TARGET_DIR}/local.crt", "rb") as f:
        cert_data = f.read()
    cert = x509.load_pem_x509_certificate(cert_data, default_backend())
    serial_number = hex(cert.serial_number).lower().lstrip("0x")

    agency = get_or_create_agency(db_session)
    opportunity = create_opportunity(db_session, agency)
    db_session.add(opportunity)
    competition = factories.CompetitionFactory(
        opportunity=opportunity,
    )
    application = factories.ApplicationFactory.create(
        competition=competition, with_forms=True, application_status=ApplicationStatus.ACCEPTED
    )
    submission = factories.ApplicationSubmissionFactory.create(application=application)
    print(f"\nTest submission GRANT{submission.legacy_tracking_number} created")
    get_or_create_legacy_certificate(db_session, agency, serial_number)
    db_session.commit()

    with open(f"{TARGET_DIR}/local.crt") as f:
        cert_text = f.read()

    encoded = quote(cert_text, safe="")
    print(
        "For local testing use this url in Postman: 'http://localhost:8080/grantsws-agency/services/v2/AgencyWebServicesSoapPort'"
    )
    print("\nCOPY AND PASTE THIS STRING INTO THE POSTMAN HEADER AS 'X-Amzn-Mtls-Clientcert'")
    print(encoded)


if __name__ == "__main__":
    db_client = db.PostgresDBClient()
    with db_client.get_session() as db_session:
        factories._db_session = db_session
        _build_legacy_certificate_and_submission(db_session)
