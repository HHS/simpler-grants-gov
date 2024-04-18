import logging
from enum import StrEnum

from sqlalchemy import select, delete

from src.adapters.db import PostgresDBClient
from src.db.models.opportunity_models import Opportunity
from src.db.models.transfer.topportunity_models import TransferTopportunity
from src.task.task import Task


from src.constants.lookup_constants import OpportunityCategory

logger = logging.getLogger(__name__)


class TransformOracleData(Task):
    class Metrics(StrEnum):
        TOTAL_RECORDS_PROCESSED = "total_records_processed"
        TOTAL_RECORDS_DELETED = "total_records_deleted"
        TOTAL_RECORDS_INSERTED = "total_records_inserted"
        TOTAL_RECORDS_UPDATED = "total_records_updated"

    def run_task(self) -> None:
        with self.db_session.begin():
            self.process_opportunities()
            # Opportunities

            # Assistance Listings

            # Opportunity Summary

            # One-to-many lookups

    def process_opportunities(self) -> None:
        # todo handle deletes and get a count somehow?
        opportunity_ids_to_delete = select(TransferTopportunity.opportunity_id).where(TransferTopportunity.publisher_profile_id == None) # TODO - make this the real query
        self.db_session.execute(delete(Opportunity).where(Opportunity.opportunity_id.in_(opportunity_ids_to_delete)))

        # TODO - add filters so it only contains updates
        # TODO - we can probably select a tuple with both in a join?
        source_opportunities: list[TransferTopportunity] = self.db_session.execute(
            select(TransferTopportunity)
        ).scalars()

        # TODO - this is just update/inserts
        # TODO - add the incrementer counter
        for source_opportunity in source_opportunities:
            target_opportunity: Opportunity | None = self.db_session.execute(
                select(Opportunity).where(
                    Opportunity.opportunity_id == source_opportunity.opportunity_id
                )
            ).scalar_one_or_none()

            # transform
            transformed_opportunity = self.transform_opportunity(
                source_opportunity, target_opportunity
            )
            self.db_session.add(transformed_opportunity)

            # TODO - set the field we query by to null (or set it? which way are we doing it?)
            # target_opportunity.whatever_field = None

    def transform_opportunity(
        self, source_opportunity: TransferTopportunity, target_opportunity: Opportunity | None
    ) -> Opportunity:
        if target_opportunity is None:
            self.increment(self.Metrics.TOTAL_RECORDS_INSERTED)
            target_opportunity = Opportunity(opportunity_id=source_opportunity.opportunity_id)
        else:
            self.increment(self.Metrics.TOTAL_RECORDS_UPDATED)

        target_opportunity.opportunity_number = source_opportunity.oppnumber
        target_opportunity.opportunity_title = source_opportunity.opptitle
        target_opportunity.agency = source_opportunity.owningagency
        target_opportunity.opportunity_category = transform_opportunity_category(
            source_opportunity.oppcategory
        )
        target_opportunity.category_explanation = source_opportunity.category_explanation
        target_opportunity.is_draft = source_opportunity.is_draft != "N"
        target_opportunity.revision_number = source_opportunity.revision_number
        target_opportunity.modified_comments = source_opportunity.modified_comments
        target_opportunity.publisher_user_id = source_opportunity.publisheruid
        target_opportunity.publisher_profile_id = source_opportunity.publisher_profile_id

        return target_opportunity

def transform_opportunity_category(value: str | None) -> OpportunityCategory | None:
    if value is None or value == "":
        return None

    match value:
        case "D":
            return OpportunityCategory.DISCRETIONARY
        case "M":
            return OpportunityCategory.MANDATORY
        case "C":
            return OpportunityCategory.CONTINUATION
        case "E":
            return OpportunityCategory.EARMARK
        case "O":
            return OpportunityCategory.OTHER

    raise ValueError(f"Unrecognized opportunity category")


# TODO - this is likely going to be run as part of a separate script
# but just to help build it out at the moment and test it, setting
# an entrypoint for easy local manual testing
def main():
    import src.logging

    with src.logging.init("transform_oracle_data"):
        db_client = PostgresDBClient()

        with db_client.get_session() as db_session:
            TransformOracleData(db_session).run()

main()