import logging
from datetime import datetime, timedelta

import pytest
from sqlalchemy import update

from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import Application
from src.task.apply.count_submitted_applications_task import CountSubmittedApplicationTask
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import ApplicationFactory


class TestCountSubmittedApplicationsTask(BaseTestClass):

    @pytest.fixture(autouse=True)
    def cleanup(self, db_session, enable_factory_create):
        # Rather than deleting apps from other tests, just
        # adjust their statuses so they don't get picked up by this test
        db_session.execute(
            update(Application).values(application_status=ApplicationStatus.ACCEPTED)
        )
        db_session.commit()

    @pytest.fixture
    def count_submitted_applications_task(self, db_session):
        return CountSubmittedApplicationTask(db_session)

    def test_run_task(
        self, db_session, count_submitted_applications_task, caplog, enable_factory_create
    ):
        caplog.set_level(logging.INFO)
        oldest_application = ApplicationFactory.create(
            application_status=ApplicationStatus.SUBMITTED,
            created_at=datetime.now() - timedelta(days=1),
        )
        ApplicationFactory.create(
            application_status=ApplicationStatus.SUBMITTED, created_at=datetime.now()
        )
        ApplicationFactory.create(application_status=ApplicationStatus.ACCEPTED)
        count_submitted_applications_task.run_task()
        record = next(r for r in caplog.records if r.message == "Submitted Application Count")
        assert record.submitted_count == 2
        assert record.oldest_submitted_age_sec > 0
        assert record.oldest_submitted_age_sec == pytest.approx(
            int((datetime.now() - oldest_application.created_at).total_seconds()), rel=0.1
        )

    def test_run_task_with_no_submitted_applications(
        self, db_session, count_submitted_applications_task, caplog, enable_factory_create
    ):
        caplog.set_level(logging.INFO)
        ApplicationFactory.create(
            application_status=ApplicationStatus.ACCEPTED, created_at=datetime.now()
        )
        ApplicationFactory.create(
            application_status=ApplicationStatus.ACCEPTED, created_at=datetime.now()
        )
        ApplicationFactory.create(application_status=ApplicationStatus.ACCEPTED)
        count_submitted_applications_task.run_task()
        record = next(r for r in caplog.records if r.message == "Submitted Application Count")
        assert record.submitted_count == 0
        assert record.oldest_submitted_age_sec == 0
