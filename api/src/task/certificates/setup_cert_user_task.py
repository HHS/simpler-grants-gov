import datetime
import logging
import uuid

import click
from sqlalchemy import select

import src.adapters.db.flask_db as flask_db
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


@task_blueprint.cli.command("setup-cert-user", help="Setup the LegacyCertificate and User")
@click.option("--cert-id", "-t", help="currentcertid on Tcertificate")
@click.option("--role-ids", "-t", help="role_id of role that needs to be added", multiple=True)
@flask_db.with_db_session()
@ecs_background_task(task_name="setup-cert-user")
def setup_cert_user(db_session: db.Session, cert_id: str, role_ids: list[str]) -> None:
    SetupCertUserTask(db_session, cert_id, role_ids).run_task()


class SetupCertUserTask(Task):

    def __init__(self, db_session: db.Session, cert_id: str, role_ids: list[str]):
        super().__init__(db_session)
        self.cert_id = cert_id
        self.role_ids = [uuid.UUID(r) for r in role_ids]

    def run_task(self) -> None:
        self.process_cert_user()

    def process_cert_user(self) -> None:
        logger.info("setup cert user start")
        roles = list(
            self.db_session.scalars(select(Role).where(Role.role_id.in_(self.role_ids))).all()
        )
        if invalid_role_uuids := self.get_invalid_role_uuids(roles):
            logger.warning(f"Invalid role ids: {invalid_role_uuids}")
            return

        tcertificate = self.db_session.scalars(
            select(staging.certificates.Tcertificates).where(
                staging.certificates.Tcertificates.currentcertid == self.cert_id
            )
        ).one_or_none()
        if tcertificate is None:
            logger.warning("Tcertificate not found")
            return
        if not tcertificate.expirationdate:
            logger.warning("Cert is missing expiration date")
            return
        if tcertificate.expirationdate <= datetime.datetime.now(datetime.UTC).date():
            logger.warning("Cert is expired")
            return
        if not tcertificate.serial_num:
            logger.warning("Tcertificate is missing serial number")
            return

        agency = self.db_session.scalar(
            select(Agency).where(Agency.agency_code == tcertificate.agencyid)
        )
        if not agency:
            logger.warning("Agency not found")
            return
        agencies: list[Agency] = [agency]
        if agency.is_multilevel_agency:
            search_pattern = f"{agency.agency_code}-%"
            agency_query_results = list(
                self.db_session.scalars(
                    select(Agency).where(Agency.agency_code.like(search_pattern))
                ).all()
            )
            agencies.extend(agency_query_results)

        if (
            self.db_session.scalars(
                select(LegacyCertificate.legacy_certificate_id).where(
                    LegacyCertificate.cert_id == tcertificate.currentcertid
                )
            ).one_or_none()
            is None
        ):
            user = self.create_user_with_agency_roles(agencies, roles)
            legacy_certificate = LegacyCertificate(
                agency=agency,
                cert_id=tcertificate.currentcertid,
                expiration_date=tcertificate.expirationdate,
                serial_number=tcertificate.serial_num,
                user=user,
            )
            self.db_session.add(legacy_certificate)
            self.db_session.commit()
        else:
            logger.warning("LegacyCertificate already exists")
        logger.info("setup cert user complete")

    def create_user_with_agency_roles(self, agencies: list[Agency], roles: list[Role]) -> User:
        user = User(user_type=UserType.LEGACY_CERTIFICATE)
        self.db_session.add(user)
        for a in agencies:
            agency_user = AgencyUser(user=user, agency=a)
            self.db_session.add(agency_user)
            agency_roles = [AgencyUserRole(agency_user=agency_user, role=r) for r in roles]
            self.db_session.add_all(agency_roles)
        return user

    def get_invalid_role_uuids(self, roles: list[Role]) -> list[str]:
        incoming_ids_set = set(self.role_ids)
        roles_id_set = set([r.role_id for r in roles])
        return [str(x) for x in (incoming_ids_set - roles_id_set)]
