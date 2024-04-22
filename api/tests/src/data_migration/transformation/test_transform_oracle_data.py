from typing import Tuple

import pytest

from src.data_migration.transformation.transform_oracle_data import TransformOracleData
from src.db.models.opportunity_models import Opportunity
from src.db.models.transfer.topportunity_models import TransferTopportunity
from tests.src.db.models.factories import OpportunityFactory, TransferTopportunityFactory


@pytest.fixture()
def transform_oracle_data(db_session) -> TransformOracleData:
    return TransformOracleData(db_session)


def setup_opportunity(
    create_existing: bool,
    is_delete: bool,
    is_already_processed: bool = False,
    transfer_values: dict | None = None,
) -> Tuple[TransferTopportunity, Opportunity | None]:
    if transfer_values is None:
        transfer_values = {}

    # TODO - right transfer opportunity
    transfer_opportunity = TransferTopportunityFactory.create(
        **transfer_values
        # TODO - use is_delete
        # TODO - use is_already_processed
    )

    opportunity = None
    if create_existing:
        opportunity = OpportunityFactory.create(
            opportunity_id=transfer_opportunity.opportunity_id,
            # set created_at/updated_at to an earlier time so its clear
            # when they were last updated
            timestamps_in_past=True,
        )

    return transfer_opportunity, opportunity


def validate_opportunity(db_session):
    pass


def test_process_opportunity():
    # TODO - what do we want to test?
    #
    # Regular scenarios
    #
    #
    # Error scenarios
    # Attempting to delete something that doesn't exist
    # Impossible conversions
    pass
