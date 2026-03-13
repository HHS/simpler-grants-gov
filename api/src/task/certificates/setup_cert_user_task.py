import logging
import uuid
from datetime import date
from enum import StrEnum

import click
from sqlalchemy import select

import src.adapters.db.flask_db as flask_db
import src.util.datetime_util as datetime_util
from src.adapters import db
from src.constants.lookup_constants import UserType
from src.db.models import staging
from src.db.models.user_models import (
    Agency,
    AgencyUser,
    AgencyUserRole,
    LegacyCertificate,
    Role,
    User,
)
from src.task.ecs_background_task import ecs_background_task
from src.task.task import Task
from src.task.task_blueprint import task_blueprint

logger = logging.getLogger(__name__)

FUTURE_DATE = date(2050, 1, 1)


class SetupCertUserTaskStatus(StrEnum):
    INVALID_ROLE_IDS = "Invalid role ids"
    AGENCY_NOT_FOUND = "Agency not found"
    LEGACY_CERTIFICATE_ALREADY_EXISTS = "LegacyCertificate already exists"
    SUCCESS = "Success"
    TCERTIFICATE_IS_EXPIRED = "Tcertificate is expired"
    TCERTIFICATE_NOT_FOUND = "Tcertificate not found"
    TCERTIFICATE_IS_MISSING_SERIAL_NUMBER = "Tcertificate is missing serial number"
    MISSING_REQUIRED_INPUT_VALUES = "Missing required input values"


@task_blueprint.cli.command("setup-cert-user", help="Setup the LegacyCertificate and User")
@click.option(
    "--tcertificates-id",
    help="tcertificates_id on Staging Tcertificate, if set to none then check for manual settings",
)
@click.option("--role-ids", help="role_id of role that needs to be added", multiple=True)
@click.option("--serial-number", default=None, help="manually set the serial number of certificate")
@click.option("--agency-code", default=None, help="manually set the agency_code of the certificate")
@click.option("--cert-id", default=None, help="manually set the cert_id of the certificate")
@flask_db.with_db_session()
@ecs_background_task(task_name="setup-cert-user")
def setup_cert_user(
    db_session: db.Session,
    tcertificates_id: str | None,
    role_ids: list[str],
    serial_number: str | None,
    agency_code: str | None,
    cert_id: str | None,
) -> None:
    SetupCertUserTask(
        db_session, tcertificates_id, role_ids, serial_number, agency_code, cert_id
    ).run_task()


# To run command in environment <env>:
#     bin/run-command api <env> '["poetry", "run", "flask", "task", "setup-cert-user", "--tcertificates-id", "<tcertificates id>", "--role-ids", "<role id>"]'
# To run command locally:
#     make cmd args="task setup-cert-user --role-ids 446bafb9-41ee-46ac-8584-889aedcd5142 --agency-code <agency code> --serial-number <serial number> --cert-id <cert id>"
class SetupCertUserTask(Task):

    def __init__(
        self,
        db_session: db.Session,
        tcertificates_id: str | None,
        role_ids: list[str],
        serial_number: str | None = None,
        agency_code: str | None = None,
        cert_id: str | None = None,
    ):
        super().__init__(db_session)
        self.tcertificates_id = tcertificates_id
        self.role_ids = role_ids

        # In order to set up a test certificate leave tcertificates_id blank and add these values
        self.serial_number = serial_number
        self.agency_code = agency_code
        self.cert_id = cert_id

    def run_task(self) -> None:
        with self.db_session.begin():
            self.setup_cert()

    def setup_cert(self) -> SetupCertUserTaskStatus:
        logger.info("setup cert user start")
        roles = self.get_roles()
        if roles is None:
            return SetupCertUserTaskStatus.INVALID_ROLE_IDS

        if self.tcertificates_id is None:
            logger.info("setting up test cert user")
            if self.serial_number and self.agency_code and self.cert_id:
                agency = self.db_session.scalar(
                    select(Agency).where(Agency.agency_code == self.agency_code)
                )
                if agency:
                    self.process_legacy_certificate(
                        self.cert_id, self.serial_number, agency, [], roles, None
                    )
                    return SetupCertUserTaskStatus.SUCCESS
                else:
                    logger.info("Agency not found")
                    return SetupCertUserTaskStatus.AGENCY_NOT_FOUND
            else:
                logger.info("Missing required inputs")
                return SetupCertUserTaskStatus.MISSING_REQUIRED_INPUT_VALUES

        tcertificate = self.get_tcertificate()
        if tcertificate is not None:
            if not tcertificate.serial_num:
                logger.warning("Tcertificate is missing serial number")
                return SetupCertUserTaskStatus.TCERTIFICATE_IS_MISSING_SERIAL_NUMBER
            valid_expiration_date = tcertificate.expirationdate or FUTURE_DATE
            if valid_expiration_date <= datetime_util.get_now_us_eastern_date():
                logger.warning("Cert is expired")
                return SetupCertUserTaskStatus.TCERTIFICATE_IS_EXPIRED
            if self.is_existing_certificate(tcertificate):
                logger.warning("LegacyCertificate already exists")
                return SetupCertUserTaskStatus.LEGACY_CERTIFICATE_ALREADY_EXISTS
            agency, related_agencies = self.get_agencies(tcertificate)
        else:
            logger.warning("Tcertificate not found")
            return SetupCertUserTaskStatus.TCERTIFICATE_NOT_FOUND
        if agency is None:
            return SetupCertUserTaskStatus.AGENCY_NOT_FOUND
        else:
            self.process_legacy_certificate(
                tcertificate.currentcertid,
                tcertificate.serial_num,
                agency,
                related_agencies,
                roles,
                valid_expiration_date,
            )
        logger.info("setup cert user complete")
        return SetupCertUserTaskStatus.SUCCESS

    def process_legacy_certificate(
        self,
        cert_id: str,
        serial_number: str | None,
        agency: Agency,
        related_agencies: list[Agency],
        roles: list[Role],
        valid_expiration_date: date | None,
    ) -> None:
        all_agencies = related_agencies + [agency]
        user = self.create_user_with_agency_roles(all_agencies, roles)
        legacy_certificate = LegacyCertificate(
            legacy_certificate_id=uuid.uuid4(),
            agency=agency,
            cert_id=cert_id,
            expiration_date=valid_expiration_date or FUTURE_DATE,
            serial_number=serial_number,
            user=user,
        )
        self.db_session.add(legacy_certificate)
        logger.info(
            "Created legacy certificate",
            extra={
                "legacy_certificate_id": legacy_certificate.legacy_certificate_id,
                "user_id": user.user_id,
                "agency_code": agency.agency_code,
            },
        )

    def create_user_with_agency_roles(self, agencies: list[Agency], roles: list[Role]) -> User:
        user = User(user_id=uuid.uuid4(), user_type=UserType.LEGACY_CERTIFICATE)
        self.db_session.add(user)

        log_extra = {"user_id": user.user_id}
        logger.info("Created legacy cert user", extra=log_extra)

        for agency in agencies:
            agency_user = AgencyUser(user=user, agency=agency)
            self.db_session.add(agency_user)

            agency_roles = [AgencyUserRole(agency_user=agency_user, role=r) for r in roles]

            self.db_session.add_all(agency_roles)

            logger.info(
                "Added user to agency",
                extra=log_extra
                | {"agency_code": agency.agency_code, "role_ids": [r.role_id for r in roles]},
            )

        return user

    def get_roles(self) -> list[Role] | None:
        roles = list(
            self.db_session.scalars(
                select(Role).where(Role.role_id.in_([uuid.UUID(r) for r in self.role_ids]))
            ).all()
        )
        if len(self.role_ids) != len(roles):
            log_extra = {"found_role_ids": [r.role_id for r in roles] if roles else []}
            logger.warning("Invalid role ids", extra=log_extra)
            return None
        return roles

    def get_tcertificate(self) -> staging.certificates.Tcertificates | None:
        return self.db_session.scalars(
            select(staging.certificates.Tcertificates).where(
                staging.certificates.Tcertificates.tcertificates_id
                == uuid.UUID(self.tcertificates_id)
            )
        ).one_or_none()

    def get_agencies(
        self, tcertificate: staging.certificates.Tcertificates
    ) -> tuple[Agency | None, list[Agency]]:
        agency = self.db_session.scalar(
            select(Agency).where(Agency.agency_code == tcertificate.agencyid)
        )
        if not agency:
            logger.warning("Agency not found")
            return (None, [])
        agencies: tuple[Agency | None, list[Agency]] = (agency, [])
        """
        If the tcertificate agency has is_multilevel marked as True then:
        1. fetch every agency that starts with the same prefix as the agency:
            SELECT * FROM agency WHERE agency_code LIKE '{agency.agency_code}-%'
        2. add an AgencyUser and AgencyUserRole for every subagency
        this is to mimic the grants.gov behavior
        """
        if agency.is_multilevel_agency:
            search_pattern = f"{agency.agency_code}-%"
            agency_query_results = list(
                self.db_session.scalars(
                    select(Agency).where(Agency.agency_code.like(search_pattern))
                ).all()
            )
            agencies[1].extend(agency_query_results)
        return agencies

    def is_existing_certificate(self, tcertificate: staging.certificates.Tcertificates) -> bool:
        existing_tcertificate = self.db_session.scalars(
            select(LegacyCertificate.legacy_certificate_id).where(
                LegacyCertificate.cert_id == tcertificate.currentcertid
            )
        ).one_or_none()
        return existing_tcertificate is not None
