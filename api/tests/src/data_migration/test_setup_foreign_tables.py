import re

import pytest
import sqlalchemy

import src.db.foreign
from src.data_migration.setup_foreign_tables import build_sql

EXPECTED_LOCAL_OPPORTUNITY_SQL = [
    "CREATE TABLE IF NOT EXISTS __[SCHEMA_legacy].topportunity (",
    "opportunity_id BIGSERIAL NOT NULL,",
    "oppnumber TEXT,",
    "revision_number BIGINT,",
    "opptitle TEXT,",
    "owningagency TEXT,",
    "publisheruid TEXT,",
    "listed TEXT,",
    "oppcategory TEXT,",
    "initial_opportunity_id BIGINT,",
    "modified_comments TEXT,",
    "created_date TIMESTAMP WITH TIME ZONE,",
    "last_upd_date TIMESTAMP WITH TIME ZONE,",
    "creator_id TEXT,",
    "last_upd_id TEXT,",
    "flag_2006 TEXT,",
    "category_explanation TEXT,",
    "publisher_profile_id BIGINT,",
    "is_draft TEXT,",
    "PRIMARY KEY (opportunity_id)",
    ")",
]

EXPECTED_NONLOCAL_OPPORTUNITY_SQL = [
    "CREATE FOREIGN TABLE IF NOT EXISTS __[SCHEMA_legacy].topportunity (",
    "opportunity_id BIGINT OPTIONS (key 'true') NOT NULL,",
    "oppnumber TEXT,",
    "revision_number BIGINT,",
    "opptitle TEXT,",
    "owningagency TEXT,",
    "publisheruid TEXT,",
    "listed TEXT,",
    "oppcategory TEXT,",
    "initial_opportunity_id BIGINT,",
    "modified_comments TEXT,",
    "created_date TIMESTAMP WITH TIME ZONE,",
    "last_upd_date TIMESTAMP WITH TIME ZONE,",
    "creator_id TEXT,",
    "last_upd_id TEXT,",
    "flag_2006 TEXT,",
    "category_explanation TEXT,",
    "publisher_profile_id BIGINT,",
    "is_draft TEXT",
    ") SERVER grants OPTIONS (schema 'EGRANTSADMIN', table 'TOPPORTUNITY', readonly 'true', prefetch '1000')",
]


TEST_METADATA = sqlalchemy.MetaData()
TEST_TABLE = sqlalchemy.Table(
    "test_table",
    TEST_METADATA,
    sqlalchemy.Column("id", sqlalchemy.Integer, nullable=False, primary_key=True),
    sqlalchemy.Column("description", sqlalchemy.Text),
    schema="schema1",
)
EXPECTED_LOCAL_TEST_SQL = [
    "CREATE TABLE IF NOT EXISTS __[SCHEMA_schema1].test_table (",
    "id SERIAL NOT NULL,",
    "description TEXT,",
    "PRIMARY KEY (id)",
    ")",
]
EXPECTED_NONLOCAL_TEST_SQL = [
    "CREATE FOREIGN TABLE IF NOT EXISTS __[SCHEMA_schema1].test_table (",
    "id INTEGER OPTIONS (key 'true') NOT NULL,",
    "description TEXT",
    ") SERVER grants OPTIONS (schema 'EGRANTSADMIN', table 'TEST_TABLE', readonly 'true', prefetch '1000')",
]


@pytest.mark.parametrize(
    "table,is_local,expected_sql",
    [
        (TEST_TABLE, True, EXPECTED_LOCAL_TEST_SQL),
        (TEST_TABLE, False, EXPECTED_NONLOCAL_TEST_SQL),
        (
            src.db.foreign.metadata.tables["legacy.topportunity"],
            True,
            EXPECTED_LOCAL_OPPORTUNITY_SQL,
        ),
        (
            src.db.foreign.metadata.tables["legacy.topportunity"],
            False,
            EXPECTED_NONLOCAL_OPPORTUNITY_SQL,
        ),
    ],
)
def test_build_sql(table, is_local, expected_sql, test_foreign_schema):
    sql = build_sql(table, is_local, test_foreign_schema)

    assert re.split(r"\s*\n\s*", sql) == expected_sql
