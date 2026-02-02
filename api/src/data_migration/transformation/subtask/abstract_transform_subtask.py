import abc
import logging
from collections.abc import Sequence
from datetime import datetime
from typing import Any, cast

from sqlalchemy import UnaryExpression, and_, select
from sqlalchemy.orm import selectinload

import src.data_migration.transformation.transform_constants as transform_constants
from src.db.models.competition_models import Competition
from src.db.models.opportunity_models import Opportunity, OpportunitySummary
from src.task.subtask import SubTask
from src.task.task import Task
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class AbstractTransformConfig(PydanticBaseEnvConfig):
    maximum_batch_count: int = 100


class AbstractTransformSubTask(SubTask):
    def __init__(self, task: Task):
        super().__init__(task)

        # This is a bit of a hacky way of making sure the task passed into this method
        # is the TransformOracleDataTask class. We could make this init function take in that
        # type specifically, but we'd run into circular type dependencies which are complex to resolve
        transform_time = getattr(task, "transform_time", None)
        if transform_time is None:
            raise Exception("Task passed into AbstractTransformSubTask must have a transform_time")

        self.abstract_transform_config = AbstractTransformConfig()
        self.transform_time: datetime = transform_time

    def has_more_to_process(self) -> bool:
        """Method for the derived classes to override if
        they want to indicate they have more batches to process

        If you do not override this, exactly one batch will get processed
        """
        return False

    def run_subtask(self) -> None:
        batch_num = 0
        while True:
            batch_num += 1
            with self.db_session.begin():
                self.transform_records()
                logger.info(
                    "Finished running set of transformations for %s - committing results",
                    self.cls_name(),
                )

                if not self.has_more_to_process():
                    break

                # As a sanity check, if more than 100 batches run, stop processing
                # and we'll assume the job got stuck. Can be overriden by MAXIMUM_BATCH_COUNT
                # env var if we know we want to support more batches.
                if batch_num > self.abstract_transform_config.maximum_batch_count:
                    logger.error(
                        "Job %s has run %s batches, stopping further processing in case job is stuck",
                        self.cls_name,
                        self.abstract_transform_config.maximum_batch_count,
                    )
                    break

            # As a safety net, expire all references in the session
            # after running. This avoids any potential complexities in
            # cached data between separate subtasks running.
            # By default sessions actually do this when committing, but
            # our db session creation logic disables it, so it's the ordinary behavior.
            self.db_session.expire_all()

    @abc.abstractmethod
    def transform_records(self) -> None:
        """Abstract method implemented by derived classes"""
        pass

    def _handle_delete(
        self,
        source: transform_constants.S,
        target: transform_constants.D | None,
        record_type: str,
        extra: dict,
        error_on_missing_target: bool = False,
    ) -> None:
        # If the target we want to delete is None, we have nothing to delete
        if target is None:
            # In some scenarios we want to error when this happens
            if error_on_missing_target:
                raise ValueError("Cannot delete %s record as it does not exist" % record_type)

            # In a lot of scenarios, we actually just want to log a message as it is expected to happen
            # For example, if we are deleting an opportunity_summary record, and already deleted the opportunity,
            # then SQLAlchemy would have deleted the opportunity_summary for us already. When we later go to delete
            # it, we'd hit this case, which isn't a problem.
            logger.info("Cannot delete %s record as it does not exist", record_type, extra=extra)
            source.transformation_notes = transform_constants.ORPHANED_DELETE_RECORD
            self.increment(
                transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED, prefix=record_type
            )
            return

        logger.info("Deleting %s record", record_type, extra=extra)
        self.increment(transform_constants.Metrics.TOTAL_RECORDS_DELETED, prefix=record_type)
        self.db_session.delete(target)

    def fetch(
        self,
        source_model: type[transform_constants.S],
        destination_model: type[transform_constants.D],
        join_clause: Sequence,
    ) -> list[tuple[transform_constants.S, transform_constants.D | None]]:
        # The real type is: Sequence[Row[Tuple[S, D | None]]]
        # but MyPy is weird about this and the Row+Tuple causes some
        # confusion in the parsing so it ends up assuming everything is Any
        # So just cast it to a simpler type that doesn't confuse anything
        return cast(
            list[tuple[transform_constants.S, transform_constants.D | None]],
            self.db_session.execute(
                select(source_model, destination_model)
                .join(destination_model, and_(*join_clause), isouter=True)
                .where(source_model.transformed_at.is_(None))
                .execution_options(yield_per=5000)
            ),
        )

    def fetch_with_opportunity(
        self,
        source_model: type[transform_constants.S],
        destination_model: type[transform_constants.D],
        join_clause: Sequence,
        batch_size: int = 5000,
        limit: int | None = None,
        order_by: UnaryExpression | None = None,
    ) -> list[tuple[transform_constants.S, transform_constants.D | None, Opportunity | None]]:
        # Similar to the above fetch function, but also grabs an opportunity record
        # Note that this requires your source_model to have an opportunity_id field defined.

        select_query = (
            select(source_model, destination_model, Opportunity)
            .join(destination_model, and_(*join_clause), isouter=True)
            .join(
                Opportunity,
                source_model.opportunity_id == Opportunity.legacy_opportunity_id,  # type: ignore[attr-defined]
                isouter=True,
            )
            .where(source_model.transformed_at.is_(None))
            .execution_options(yield_per=batch_size)
        )

        if order_by is not None:
            select_query = select_query.order_by(order_by)

        if limit is not None:
            select_query = select_query.limit(limit)

        return cast(
            list[tuple[transform_constants.S, transform_constants.D | None, Opportunity | None]],
            self.db_session.execute(select_query),
        )

    def fetch_with_opportunity_summary(
        self,
        source_model: type[transform_constants.S],
        destination_model: type[transform_constants.D],
        join_clause: Sequence,
        is_forecast: bool,
        is_delete: bool,
        relationship_load_value: Any,
    ) -> list[
        tuple[transform_constants.S, transform_constants.D | None, OpportunitySummary | None]
    ]:
        # setup the join clause for getting the opportunity summary
        opportunity_summary_join_clause = [
            source_model.opportunity_id == OpportunitySummary.legacy_opportunity_id,  # type: ignore[attr-defined]
            OpportunitySummary.is_forecast.is_(is_forecast),
        ]

        return cast(
            list[
                tuple[
                    transform_constants.S, transform_constants.D | None, OpportunitySummary | None
                ]
            ],
            self.db_session.execute(
                select(source_model, destination_model, OpportunitySummary)
                .join(OpportunitySummary, and_(*opportunity_summary_join_clause), isouter=True)
                .join(destination_model, and_(*join_clause), isouter=True)
                .where(source_model.transformed_at.is_(None))
                .where(source_model.is_deleted.is_(is_delete))
                .options(selectinload(relationship_load_value))
                .execution_options(yield_per=5000, populate_existing=True)
            ),
        )

    def fetch_with_competition(
        self,
        source_model: type[transform_constants.S],
        destination_model: type[transform_constants.D],
        join_clause: Sequence,
        batch_size: int = 5000,
        limit: int | None = None,
        order_by: UnaryExpression | None = None,
    ) -> list[tuple[transform_constants.S, transform_constants.D | None, Competition | None]]:
        select_query = (
            select(source_model, destination_model, Competition)
            .join(destination_model, and_(*join_clause), isouter=True)
            .join(
                Competition,
                source_model.comp_id == Competition.legacy_competition_id,  # type: ignore[attr-defined]
                isouter=True,
            )
            .where(source_model.transformed_at.is_(None))
            .execution_options(yield_per=batch_size)
        )

        if order_by is not None:
            select_query = select_query.order_by(order_by)

        if limit is not None:
            select_query = select_query.limit(limit)

        return cast(
            list[tuple[transform_constants.S, transform_constants.D | None, Competition | None]],
            self.db_session.execute(select_query),
        )
