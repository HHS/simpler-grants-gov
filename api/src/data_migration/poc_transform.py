#
# Proof of concept transform implemented in Python.
#

import logging

import sqlalchemy

import src.adapters.db
import src.logging
from src.db.foreign import ForeignTopportunity
from src.db.models.opportunity_models import Opportunity, OpportunityCategory
from src.constants.lookup_constants import OpportunityCategoryLegacy

logger = logging.getLogger("poc_transform")


def main():
    with src.logging.init("poc_transform"):
        logger.info("transform start")

        db_client = src.adapters.db.PostgresDBClient()

        with db_client.get_session() as db_session:
            with db_session.begin():
                 transform = Transform(db_session)
                 transform.run()

            logger.info(
                "transform done",
                extra={
                    "transform.modified_count": transform.modified_count,
                    "transform.new_count": transform.new_count,
                    "transform.unmodified_count": transform.unmodified_count,
                },
            )


class Transform:
    """Transform data from source (foreign) tables to the API tables."""

    def __init__(self, db_session: src.adapters.db.Session):
        self.db_session = db_session
        self.unmodified_count = 0
        self.modified_count = 0
        self.new_count = 0
        self.bulk_insert_queue = []
        self.existing_opportunity = {}

    def run(self) -> None:
        # Read existing data from the opportunity table
        self.read_existing_data()

        # Process each row in the source foreign_topportunity table
        total_count = self.db_session.query(ForeignTopportunity.opportunity_id).count()
        rows = self.db_session.query(ForeignTopportunity).order_by(
            ForeignTopportunity.opportunity_id
        )
        for row in iterate_with_log(rows, total_count):
            self.transform_row(row)

        # Flush any remaining bulk inserts
        self.bulk_insert(None, flush=True)

    def read_existing_data(self):
        """Read existing opportunity data from the database into memory."""
        self.existing_opportunity = {
            opportunity.opportunity_id: opportunity
            for opportunity in self.db_session.query(Opportunity)
        }
        logger.info(
            "read opportunity table", extra={"opportunity.count": len(self.existing_opportunity)}
        )

    def transform_row(self, foreign_opportunity: ForeignTopportunity) -> None:
        opportunity_id = foreign_opportunity.opportunity_id

        new = translate_foreign_to_normalized(foreign_opportunity)
        # logger.info("new data %r", foreign_opportunity)
        # logger.info("new translated %r", new)

        if opportunity_id in self.existing_opportunity:
            self.update_row(opportunity_id, new)
        else:
            self.add_row(new)

    def update_row(self, opportunity_id: int, new: dict):
        existing = self.existing_opportunity[opportunity_id]
        existing_attributes = {key: getattr(existing, key) for key in new}
        if existing_attributes == new:
            # logger.info("unmodified", extra={"opportunity_id": opportunity_id})
            self.unmodified_count += 1
            return

        logger.info(
            "modified",
            extra={
                "opportunity_id": opportunity_id,
                "transform.old": dict(existing_attributes.items() - new.items()),
                "transform.new": dict(new.items() - existing_attributes.items()),
            },
        )
        self.modified_count += 1
        self.db_session.merge(Opportunity(**new))

    def add_row(self, new: dict):
        self.new_count += 1
        self.bulk_insert(new)

    def bulk_insert(self, row: dict | None, flush: bool = False):
        if row:
            self.bulk_insert_queue.append(row)
        if (not flush and len(self.bulk_insert_queue) < 10000) or len(self.bulk_insert_queue) == 0:
            return
        logger.info("bulk insert", extra={"count": len(self.bulk_insert_queue)})
        self.db_session.execute(
            sqlalchemy.insert(Opportunity).execution_options(render_nulls=True),
            self.bulk_insert_queue,
        )
        self.bulk_insert_queue = []


def translate_foreign_to_normalized(foreign_opportunity: ForeignTopportunity) -> dict:
    return dict(
        opportunity_id=foreign_opportunity.opportunity_id,
        opportunity_number=foreign_opportunity.oppnumber,
        opportunity_title=foreign_opportunity.opptitle,
        agency=foreign_opportunity.owningagency,
        category=OpportunityCategory[
            OpportunityCategoryLegacy(foreign_opportunity.oppcategory).name
        ],
        category_explanation=foreign_opportunity.category_explanation,
        is_draft=foreign_opportunity.is_draft == "Y",
        revision_number=str(foreign_opportunity.revision_number),  # TODO: convert to numeric
        modified_comments=foreign_opportunity.modified_comments,
        publisher_user_id=foreign_opportunity.publisheruid,
        publisher_profile_id=foreign_opportunity.publisher_profile_id,
    )


def iterate_with_log(iterable, total_count):
    """Yield each item in the iterable, with a regular log message."""
    for index, item in enumerate(iterable, start=1):
        yield item

        if index % 5000 == 0 or index == total_count:
            logger.info(
                f"processed {index}/{total_count} ({index / total_count:.1%})",
                extra={"count": index, "total": total_count},
                stacklevel=2,
            )


if __name__ == "__main__":
    main()
