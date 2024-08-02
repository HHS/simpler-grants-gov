import abc
import logging
from datetime import datetime
from typing import Any, Sequence, Tuple, Type, cast

from sqlalchemy import and_, select
from sqlalchemy.orm import selectinload

import src.data_migration.transformation.transform_constants as transform_constants
from src.db.models.opportunity_models import Opportunity, OpportunitySummary
from src.task.subtask import SubTask
from src.task.task import Task

logger = logging.getLogger(__name__)


class AbstractTransformSubTask(SubTask):
    def __init__(self, task: Task):
        super().__init__(task)

        # This is a bit of a hacky way of making sure the task passed into this method
        # is the TransformOracleDataTask class. We could make this init function take in that
        # type specifically, but we'd run into circular type dependencies which are complex to resolve
        transform_time = getattr(task, "transform_time", None)
        if transform_time is None:
            raise Exception("Task passed into AbstractTransformSubTask must have a transform_time")

        self.transform_time: datetime = transform_time

    def run_subtask(self) -> None:
        with self.db_session.begin():
            self.transform_records()
            logger.info(
                "Finished running transformations for %s - committing results", self.cls_name()
            )

        # As a safety net, expire all references in the session
        # after running. This avoids any potential complexities in
        # cached data between separate subtasks running.
        # By default sessions actually do this when committing, but
        # our db session creation logic disables it, so it's the ordinary behavior.
        self.db_session.expire_all()

    @abc.abstractmethod
    def transform_records(self) -> None:
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

    def _is_orphaned_historical(
        self,
        parent_record: Opportunity | OpportunitySummary | None,
        source_record: transform_constants.SourceAny,
    ) -> bool:
        return parent_record is None and source_record.is_historical_table

    def _handle_orphaned_historical(
        self, source_record: transform_constants.SourceAny, record_type: str, extra: dict
    ) -> None:
        logger.warning(
            "Historical %s does not have a corresponding parent record - cannot import, but will mark as processed",
            record_type,
            extra=extra,
        )
        self.increment(
            transform_constants.Metrics.TOTAL_HISTORICAL_ORPHANS_SKIPPED, prefix=record_type
        )
        source_record.transformation_notes = transform_constants.ORPHANED_HISTORICAL_RECORD

    def fetch(
        self,
        source_model: Type[transform_constants.S],
        destination_model: Type[transform_constants.D],
        join_clause: Sequence,
    ) -> list[Tuple[transform_constants.S, transform_constants.D | None]]:
        # The real type is: Sequence[Row[Tuple[S, D | None]]]
        # but MyPy is weird about this and the Row+Tuple causes some
        # confusion in the parsing so it ends up assuming everything is Any
        # So just cast it to a simpler type that doesn't confuse anything
        return cast(
            list[Tuple[transform_constants.S, transform_constants.D | None]],
            self.db_session.execute(
                select(source_model, destination_model)
                .join(destination_model, and_(*join_clause), isouter=True)
                .where(source_model.transformed_at.is_(None))
                .execution_options(yield_per=5000)
            ),
        )

    def fetch_with_opportunity(
        self,
        source_model: Type[transform_constants.S],
        destination_model: Type[transform_constants.D],
        join_clause: Sequence,
    ) -> list[Tuple[transform_constants.S, transform_constants.D | None, Opportunity | None]]:
        # Similar to the above fetch function, but also grabs an opportunity record
        # Note that this requires your source_model to have an opportunity_id field defined.

        return cast(
            list[Tuple[transform_constants.S, transform_constants.D | None, Opportunity | None]],
            self.db_session.execute(
                select(source_model, destination_model, Opportunity)
                .join(destination_model, and_(*join_clause), isouter=True)
                .join(
                    Opportunity,
                    source_model.opportunity_id == Opportunity.opportunity_id,  # type: ignore[attr-defined]
                    isouter=True,
                )
                .where(source_model.transformed_at.is_(None))
                .execution_options(yield_per=5000)
            ),
        )

    def fetch_with_opportunity_summary(
        self,
        source_model: Type[transform_constants.S],
        destination_model: Type[transform_constants.D],
        join_clause: Sequence,
        is_forecast: bool,
        is_historical_table: bool,
        relationship_load_value: Any,
    ) -> list[
        Tuple[transform_constants.S, transform_constants.D | None, OpportunitySummary | None]
    ]:
        # setup the join clause for getting the opportunity summary

        opportunity_summary_join_clause = [
            source_model.opportunity_id == OpportunitySummary.opportunity_id,  # type: ignore[attr-defined]
            OpportunitySummary.is_forecast.is_(is_forecast),
        ]

        if is_historical_table:
            opportunity_summary_join_clause.append(
                source_model.revision_number == OpportunitySummary.revision_number  # type: ignore[attr-defined]
            )
        else:
            opportunity_summary_join_clause.append(OpportunitySummary.revision_number.is_(None))

        return cast(
            list[
                Tuple[
                    transform_constants.S, transform_constants.D | None, OpportunitySummary | None
                ]
            ],
            self.db_session.execute(
                select(source_model, destination_model, OpportunitySummary)
                .join(OpportunitySummary, and_(*opportunity_summary_join_clause), isouter=True)
                .join(destination_model, and_(*join_clause), isouter=True)
                .where(source_model.transformed_at.is_(None))
                .options(selectinload(relationship_load_value))
                .execution_options(yield_per=5000, populate_existing=True)
            ),
        )
