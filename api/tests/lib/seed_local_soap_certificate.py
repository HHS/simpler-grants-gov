import logging
from datetime import timedelta
from pathlib import Path
from urllib.parse import quote

import click
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
from sqlalchemy import select

import src.adapters.db as db
import src.logging
import src.util.datetime_util as datetime_util
import tests.src.db.models.factories as factories
from src.constants.lookup_constants import Privilege
from src.db.models.agency_models import Agency
from src.db.models.competition_models import ApplicationSubmission
from src.db.models.user_models import LegacyCertificate

logger = logging.getLogger(__name__)
PRIVILEGES = {
    Privilege.LEGACY_AGENCY_VIEWER,
    Privilege.LEGACY_AGENCY_GRANT_RETRIEVER,
    Privilege.LEGACY_AGENCY_ASSIGNER,
}
UTC_NOW = datetime_util.utcnow()


def create_private_key(path_key):
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


def create_cert(key, path_crt) -> None:
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


def get_agency(db_session, agency_code):
    if not agency_code:
        submission = db_session.execute(select(ApplicationSubmission)).scalars().first()
        if not submission:
            raise click.ClickException(
                "No Submissions not found. Run `make db-seed-local-with-agencies` first."
            )
        agency_code = submission.application.competition.opportunity.agency_code
    logger.info(f"Using agency {agency_code} for legacy certificate")
    return db_session.scalar(select(Agency).where(Agency.agency_code == agency_code))


def get_or_create_legacy_certificate(db_session, agency, serial_number):
    legacy_certificate = db_session.scalar(
        select(LegacyCertificate).where(LegacyCertificate.serial_number == serial_number)
    )
    if legacy_certificate is None:
        legacy_certificate = factories.LegacyAgencyCertificateFactory(
            agency_id=agency.agency_id,
            agency=agency,
            serial_number=serial_number,
            expiration_date=UTC_NOW.date() + timedelta(days=365),
        )
        agency_user = factories.AgencyUserFactory.create(
            agency=agency, user=legacy_certificate.user
        )
        role = factories.RoleFactory.create(privileges=PRIVILEGES, is_agency_role=True)
        factories.AgencyUserRoleFactory.create(agency_user=agency_user, role=role)
        db_session.add(legacy_certificate)
    else:
        logger.info("Test legacy_certificate already exists")


def _build_legacy_certificate_and_submission(
    db_session: db.Session, directory: Path, agency_code: str | None
) -> None:
    path_key = directory / "local.key"
    path_crt = directory / "local.crt"
    if path_key.exists() and path_crt.exists():
        logger.info("cert and key file exist")
    else:
        key = create_private_key(path_key)
        create_cert(key, path_crt)
    with open(path_crt, "rb") as f:
        cert_data = f.read()
    cert = x509.load_pem_x509_certificate(cert_data, default_backend())
    serial_number = hex(cert.serial_number).lower().lstrip("0x")

    agency = get_agency(db_session, agency_code)
    if not agency:
        raise click.ClickException(
            f"Agency '{agency_code}' not found. Run `make db-seed-local-with-agencies` first."
        )
    get_or_create_legacy_certificate(db_session, agency, serial_number)
    db_session.commit()

    with open(path_crt) as f:
        cert_text = f.read()

    encoded = quote(cert_text, safe="")
    print(
        "\nFor local testing use this url in Postman: 'http://localhost:8080/grantsws-agency/services/v2/AgencyWebServicesSoapPort'"
    )
    print("\nCOPY AND PASTE THIS STRING INTO THE POSTMAN HEADER AS 'X-Amzn-Mtls-Clientcert'")
    print(encoded)


# Before running this command run
# `make init && make db-seed-local-with-agencies && make run-logs`
# By default it will grab the first submission it can find and make a LegacyCertificate for it
# in order to hit the locally running instance
# the command looks like
# `make seed-local-soap-certificate DIR_PATH="~/test/cache/"`
# DIR_PATH starting with `~` will  put it on the docker instance if you don't include a `~` it will write to the api dir
@click.command()
@click.option(
    "--dir-path",
    required=True,
    help="Directory path for the certificate and key file",
)
@click.option(
    "--agency-code",
    help="Agency code to use (defaults to agency of first submission it can find)",
)
def seed_local_soap_certificate(dir_path: str, agency_code: str | None = None) -> None:
    with src.logging.init("seed_local_soap_certificate"):
        logger.info("Running seed script for local soap certificate testing")
        db_client = db.PostgresDBClient()
        with db_client.get_session() as db_session:
            directory = Path(dir_path)
            directory.mkdir(parents=True, exist_ok=True)
            factories._db_session = db_session
            _build_legacy_certificate_and_submission(
                db_session, directory, agency_code if agency_code else None
            )
