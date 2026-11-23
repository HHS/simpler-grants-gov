import logging
from enum import StrEnum

from sqlalchemy import BigInteger, cast, extract, func, select

import src.adapters.db as db
from src.adapters.db import flask_db
from src.constants.lookup_constants import ApplicationStatus, JobType
from src.db.models.competition_models import Application
from src.task.ecs_background_task import ecs_background_task
from src.task.task import Task
from src.task.task_blueprint import task_blueprint

logger = logging.getLogger(__name__)


class CountSubmittedApplicationsStateTask(Task):

    def __init__(
        self,
        db_session: db.Session,
    ):
        super().__init__(db_session)

    class Metrics(StrEnum):
        SUBMITTED_COUNT = "submitted_count"
        OLDEST_SUBMITTED_AGE_SEC = "oldest_submitted_age_sec"

    def run_task(self) -> None:
        calculate_age_sec = cast(
            func.coalesce(
                extract("epoch", func.now() - func.min(Application.submitted_at)),
                0,
            ),
            BigInteger,
        ).label("oldest_submitted_age_sec")
        stmt = select(
            func.count(Application.application_id).label("submitted_count"), calculate_age_sec
        ).where(Application.application_status == ApplicationStatus.SUBMITTED)

        with self.db_session.begin():
            row = self.db_session.execute(stmt).one()

        self.set_metrics(
            {
                self.Metrics.SUBMITTED_COUNT: row.submitted_count,
                self.Metrics.OLDEST_SUBMITTED_AGE_SEC: row.oldest_submitted_age_sec,
            }
        )


@task_blueprint.cli.command(
    "count-submitted-applications-state",
    help="Count applications in SUBMITTED status and how long the oldest one has been hanging",
)
@flask_db.with_db_session()
@ecs_background_task(task_name=JobType.COUNT_SUBMITTED_APPLICATIONS)
def count_submitted_applications_state(db_session: db.Session) -> None:
    CountSubmittedApplicationsStateTask(db_session).run()
