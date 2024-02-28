from datetime import date

import pytest
from sqlalchemy import text

from src.data_migration.copy_oracle_data import _run_copy_commands
from src.data_migration.setup_foreign_tables import _run_create_table_commands
from src.db.models.transfer.topportunity_models import TransferTopportunity
from tests.src.db.models.factories import ForeignTopportunityFactory, TransferTopportunityFactory


@pytest.fixture(autouse=True)
def setup_env_vars(monkeypatch):
    monkeypatch.setenv("IS_LOCAL_FOREIGN_TABLE", "true")


@pytest.fixture(autouse=True)
def setup_foreign_tables(db_session):
    _run_create_table_commands(db_session)


@pytest.fixture(autouse=True, scope="function")
def truncate_tables(db_session):
    # Automatically delete all the data in the relevant tables before tests
    db_session.execute(text("TRUNCATE TABLE foreign_topportunity"))
    db_session.execute(text("TRUNCATE TABLE transfer_topportunity"))


def convert_value_for_insert(value) -> str:
    if value is None:
        return "NULL"

    if isinstance(value, int):
        return str(value)
    if isinstance(value, str):
        return f"'{value}'"  # noqa: B907
    if isinstance(value, date):
        return f"'{value.isoformat()}'"  # noqa: B907

    raise Exception("Type not configured for conversion")


def build_foreign_opportunity(db_session, opp_params: dict):
    opp = ForeignTopportunityFactory.build(**opp_params)

    columns = opp.keys()
    values = [convert_value_for_insert(opp[column]) for column in columns]

    db_session.execute(
        text(
            f"INSERT INTO foreign_topportunity ({','.join(columns)}) VALUES ({','.join(values)})"  # nosec
        )
    )

    return opp


def test_copy_oracle_data_foreign_empty(db_session, enable_factory_create):
    TransferTopportunityFactory.create_batch(size=5)
    # The foreign table is empty, so this just truncates the transfer table
    assert db_session.query(TransferTopportunity).count() == 5
    _run_copy_commands(db_session)
    assert db_session.query(TransferTopportunity).count() == 0


def test_copy_oracle_data(db_session, enable_factory_create):
    print(db_session.__class__.__name__)

    # Create some records initially in the table that we'll wipe
    TransferTopportunityFactory.create_batch(size=3)

    foreign_records = [
        build_foreign_opportunity(db_session, {}),
        build_foreign_opportunity(db_session, {}),
        build_foreign_opportunity(db_session, {}),
        build_foreign_opportunity(db_session, {"oppnumber": "ABC-123-454-321-CBA"}),
        build_foreign_opportunity(db_session, {"opportunity_id": 100}),
    ]

    # The copy script won't fetch anything with is_draft not equaling "N" so add one
    build_foreign_opportunity(db_session, {"is_draft": "Y"})

    _run_copy_commands(db_session)

    copied_opportunities = db_session.query(TransferTopportunity).all()

    assert len(copied_opportunities) == len(foreign_records)

    copied_opportunities.sort(key=lambda opportunity: opportunity.opportunity_id)
    foreign_records.sort(key=lambda opportunity: opportunity["opportunity_id"])

    for copied_opportunity, foreign_record in zip(
        copied_opportunities, foreign_records, strict=True
    ):
        assert copied_opportunity.opportunity_id == foreign_record["opportunity_id"]
        assert copied_opportunity.oppnumber == foreign_record["oppnumber"]
        assert copied_opportunity.opptitle == foreign_record["opptitle"]
        assert copied_opportunity.owningagency == foreign_record["owningagency"]
        assert copied_opportunity.oppcategory == foreign_record["oppcategory"]
        assert copied_opportunity.category_explanation == foreign_record["category_explanation"]
        assert copied_opportunity.is_draft == foreign_record["is_draft"]
        assert copied_opportunity.revision_number == foreign_record["revision_number"]
        assert copied_opportunity.last_upd_date == foreign_record["last_upd_date"]
        assert copied_opportunity.created_date == foreign_record["created_date"]
