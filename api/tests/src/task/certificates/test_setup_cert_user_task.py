import uuid
from datetime import date

from sqlalchemy import func, select

from src.db.models.user_models import AgencyUser, AgencyUserRole, LegacyCertificate
from src.task.certificates.setup_cert_user_task import (
    FUTURE_DATE,
    SetupCertUserTask,
    SetupCertUserTaskStatus,
)
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import (
    AgencyFactory,
    LegacyAgencyCertificateFactory,
    RoleFactory,
    StagingTcertificatesFactory,
)


class TestSetupCertUserTask(BaseTestClass):
    def test_setup_cert_user_raises_error_if_no_role_matching_uuid(
        self, enable_factory_create, db_session, caplog
    ):
        role_id = str(uuid.uuid4())
        tcertificate = StagingTcertificatesFactory()
        cert_id = str(tcertificate.currentcertid)
        result = SetupCertUserTask(db_session, cert_id, [role_id]).run_task()
        assert result == SetupCertUserTaskStatus.INVALID_ROLE_IDS
        warning_messages = [r.getMessage() for r in caplog.records if r.levelname == "WARNING"]
        assert "Invalid role ids" in warning_messages

    def test_setup_cert_user_raises_error_if_no_tcertificate(
        self, enable_factory_create, db_session, caplog
    ):
        role = RoleFactory.create(is_agency_role=True)
        cert_id = str(uuid.uuid4())
        result = SetupCertUserTask(db_session, cert_id, [str(role.role_id)]).run_task()
        assert result == SetupCertUserTaskStatus.TCERTIFICATE_NOT_FOUND
        warning_messages = [r.getMessage() for r in caplog.records if r.levelname == "WARNING"]
        assert "Tcertificate not found" in warning_messages

    def test_setup_cert_user_if_cert_is_expired(self, enable_factory_create, db_session, caplog):
        role = RoleFactory.create(is_agency_role=True)
        agency = AgencyFactory(agency_code=f"XYZ-{uuid.uuid4()}", is_multilevel_agency=False)
        tcertificate = StagingTcertificatesFactory(
            expirationdate=date(2023, 12, 31), agencyid=agency.agency_code
        )
        cert_id = str(tcertificate.currentcertid)
        result = SetupCertUserTask(db_session, cert_id, [str(role.role_id)]).run_task()
        assert result == SetupCertUserTaskStatus.TCERTIFICATE_IS_EXPIRED
        warning_messages = [r.getMessage() for r in caplog.records if r.levelname == "WARNING"]
        assert "Cert is expired" in warning_messages

    def test_setup_cert_user_if_cert_agency_does_not_exist(
        self, enable_factory_create, db_session, caplog
    ):
        role = RoleFactory.create(is_agency_role=True)
        tcertificate = StagingTcertificatesFactory()
        cert_id = str(tcertificate.currentcertid)
        result = SetupCertUserTask(db_session, cert_id, [str(role.role_id)]).run_task()
        assert result == SetupCertUserTaskStatus.AGENCY_NOT_FOUND
        warning_messages = [r.getMessage() for r in caplog.records if r.levelname == "WARNING"]
        assert "Agency not found" in warning_messages

    def test_setup_cert_user_if_tcertificate_is_missing_serial_number(
        self, enable_factory_create, db_session, caplog
    ):
        role = RoleFactory.create(is_agency_role=True)
        agency = AgencyFactory(agency_code=f"XYZ-{uuid.uuid4()}", is_multilevel_agency=False)
        tcertificate = StagingTcertificatesFactory(serial_num=None, agencyid=agency.agency_code)
        cert_id = str(tcertificate.currentcertid)
        result = SetupCertUserTask(db_session, cert_id, [str(role.role_id)]).run_task()
        assert result == SetupCertUserTaskStatus.TCERTIFICATE_IS_MISSING_SERIAL_NUMBER
        warning_messages = [r.getMessage() for r in caplog.records if r.levelname == "WARNING"]
        assert "Tcertificate is missing serial number" in warning_messages

    def test_setup_cert_user_creates_legacy_certificate_user(
        self, enable_factory_create, db_session
    ):
        role = RoleFactory.create(is_agency_role=True)
        agency = AgencyFactory(agency_code=f"XYZ-{uuid.uuid4()}", is_multilevel_agency=False)
        tcertificate = StagingTcertificatesFactory(agencyid=agency.agency_code)
        cert_id = str(tcertificate.currentcertid)
        result = SetupCertUserTask(db_session, cert_id, [str(role.role_id)]).run_task()
        assert result == SetupCertUserTaskStatus.SUCCESS
        legacy_certificate = (
            db_session.query(LegacyCertificate).filter(LegacyCertificate.cert_id == cert_id).first()
        )
        assert legacy_certificate.user

    def test_setup_cert_user_creates_legacy_certificate(self, enable_factory_create, db_session):
        role = RoleFactory.create(is_agency_role=True)
        agency = AgencyFactory(agency_code=f"XYZ-{uuid.uuid4()}", is_multilevel_agency=False)
        tcertificate = StagingTcertificatesFactory(
            agencyid=agency.agency_code, expirationdate=date(2070, 12, 31)
        )
        cert_id = str(tcertificate.currentcertid)
        result = SetupCertUserTask(db_session, cert_id, [str(role.role_id)]).run_task()
        assert result == SetupCertUserTaskStatus.SUCCESS
        legacy_certificate = db_session.scalars(
            select(LegacyCertificate).where(LegacyCertificate.cert_id == tcertificate.currentcertid)
        ).one_or_none()
        assert legacy_certificate
        assert legacy_certificate.agency == agency
        assert legacy_certificate.user
        assert legacy_certificate.serial_number == tcertificate.serial_num
        assert legacy_certificate.expiration_date == tcertificate.expirationdate

    def test_setup_cert_user_assigns_an_expiration_date_if_tcertificate_does_not_have_one(
        self, enable_factory_create, db_session, caplog
    ):
        role = RoleFactory.create(is_agency_role=True)
        agency = AgencyFactory(agency_code=f"XYZ-{uuid.uuid4()}", is_multilevel_agency=False)
        tcertificate = StagingTcertificatesFactory(agencyid=agency.agency_code, expirationdate=None)
        cert_id = str(tcertificate.currentcertid)
        result = SetupCertUserTask(db_session, cert_id, [str(role.role_id)]).run_task()
        assert result == SetupCertUserTaskStatus.SUCCESS
        legacy_certificate_expiration_date = db_session.execute(
            select(LegacyCertificate.expiration_date).where(LegacyCertificate.cert_id == cert_id)
        ).scalar()
        assert legacy_certificate_expiration_date == FUTURE_DATE

    def test_setup_cert_user_does_not_create_legacy_certificate_if_it_already_exists(
        self, enable_factory_create, db_session, caplog
    ):
        role = RoleFactory.create(is_agency_role=True)
        agency = AgencyFactory(agency_code=f"XYZ-{uuid.uuid4()}", is_multilevel_agency=False)
        tcertificate = StagingTcertificatesFactory(agencyid=agency.agency_code)
        cert_id = str(tcertificate.currentcertid)
        LegacyAgencyCertificateFactory(cert_id=cert_id, agency=agency)
        result = SetupCertUserTask(db_session, cert_id, [str(role.role_id)]).run_task()
        assert result == SetupCertUserTaskStatus.LEGACY_CERTIFICATE_ALREADY_EXISTS
        legacy_certificate_count = db_session.scalars(
            select(func.count(LegacyCertificate.legacy_certificate_id)).where(
                LegacyCertificate.cert_id == cert_id
            )
        ).one()
        assert legacy_certificate_count == 1
        warning_messages = [r.getMessage() for r in caplog.records if r.levelname == "WARNING"]
        assert "LegacyCertificate already exists" in warning_messages

    def test_setup_cert_user_creates_agency_user_and_agency_user_role(
        self, enable_factory_create, db_session
    ):
        role = RoleFactory.create(is_agency_role=True)
        agency = AgencyFactory(agency_code=f"XYZ-{uuid.uuid4()}", is_multilevel_agency=False)
        tcertificate = StagingTcertificatesFactory(agencyid=agency.agency_code)
        cert_id = str(tcertificate.currentcertid)
        result = SetupCertUserTask(db_session, cert_id, [str(role.role_id)]).run_task()
        assert result == SetupCertUserTaskStatus.SUCCESS
        legacy_certificate = (
            db_session.query(LegacyCertificate).filter(LegacyCertificate.cert_id == cert_id).first()
        )
        user = legacy_certificate.user
        agency_user = db_session.scalars(
            select(AgencyUser).where(AgencyUser.user == user)
        ).one_or_none()
        assert agency_user
        agency_user_role = db_session.scalars(
            select(AgencyUserRole).where(AgencyUserRole.agency_user == agency_user)
        ).one_or_none()
        assert agency_user_role.role.role_id == role.role_id

    def test_setup_cert_user_creates_agency_user_and_multiple_agency_user_roles(
        self, enable_factory_create, db_session
    ):
        role_1 = RoleFactory.create(is_agency_role=True)
        role_2 = RoleFactory.create(is_agency_role=True)
        agency = AgencyFactory(agency_code=f"XYZ-{uuid.uuid4()}", is_multilevel_agency=False)
        tcertificate = StagingTcertificatesFactory(agencyid=agency.agency_code)
        cert_id = str(tcertificate.currentcertid)
        result = SetupCertUserTask(
            db_session, cert_id, [str(role_1.role_id), str(role_2.role_id)]
        ).run_task()
        assert result == SetupCertUserTaskStatus.SUCCESS
        legacy_certificate = (
            db_session.query(LegacyCertificate).filter(LegacyCertificate.cert_id == cert_id).first()
        )
        user = legacy_certificate.user
        agency_user_ids = list(
            db_session.scalars(
                select(AgencyUser.agency_user_id).where(AgencyUser.user == user)
            ).all()
        )
        assert agency_user_ids
        agency_user_roles = list(
            db_session.scalars(
                select(AgencyUserRole.role_id).where(
                    AgencyUserRole.agency_user_id.in_(agency_user_ids)
                )
            ).all()
        )
        assert role_1.role_id in agency_user_roles
        assert role_2.role_id in agency_user_roles

    def test_setup_cert_user_creates_agency_user_and_agency_user_role_when_is_multilevel_agency(
        self, enable_factory_create, db_session
    ):
        role = RoleFactory.create(is_agency_role=True)
        agency_code = f"XYZ-{uuid.uuid4()}"
        agency_1 = AgencyFactory(agency_code=agency_code, is_multilevel_agency=True)
        agency_2 = AgencyFactory(agency_code=f"{agency_code}-ABC", is_multilevel_agency=False)
        tcertificate = StagingTcertificatesFactory(agencyid=agency_1.agency_code)
        cert_id = str(tcertificate.currentcertid)
        result = SetupCertUserTask(db_session, cert_id, [str(role.role_id)]).run_task()
        assert result == SetupCertUserTaskStatus.SUCCESS
        legacy_certificate = (
            db_session.query(LegacyCertificate).filter(LegacyCertificate.cert_id == cert_id).first()
        )
        user = legacy_certificate.user
        agency_user_1 = db_session.scalars(
            select(AgencyUser).where(AgencyUser.user == user, AgencyUser.agency == agency_1)
        ).one_or_none()
        assert agency_user_1
        agency_user_role_1 = db_session.scalars(
            select(AgencyUserRole).where(AgencyUserRole.agency_user == agency_user_1)
        ).one_or_none()
        assert agency_user_role_1.role.role_id == role.role_id
        agency_user_2 = db_session.scalars(
            select(AgencyUser).where(AgencyUser.user == user, AgencyUser.agency == agency_2)
        ).one_or_none()
        assert agency_user_2
        agency_user_role_2 = db_session.scalars(
            select(AgencyUserRole).where(AgencyUserRole.agency_user == agency_user_2)
        ).one_or_none()
        assert agency_user_role_2.role.role_id == role.role_id
