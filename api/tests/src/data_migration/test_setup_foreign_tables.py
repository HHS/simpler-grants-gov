import re

import pytest
import sqlalchemy

import src.db.foreign
from src.data_migration.setup_foreign_tables import build_sql

EXPECTED_LOCAL_OPPORTUNITY_SQL = [
    "CREATE TABLE IF NOT EXISTS __[SCHEMA_grants].topportunity (",
    "opportunity_id NUMERIC(20) NOT NULL,",
    "oppnumber VARCHAR(40),",
    "revision_number NUMERIC(20),",
    "opptitle VARCHAR(255),",
    "owningagency VARCHAR(255),",
    "publisheruid VARCHAR(255),",
    "listed CHAR(1),",
    "oppcategory CHAR(1),",
    "initial_opportunity_id NUMERIC(20),",
    "modified_comments VARCHAR(2000),",
    "created_date DATE,",
    "last_upd_date DATE,",
    "creator_id VARCHAR(50),",
    "last_upd_id VARCHAR(50),",
    "flag_2006 CHAR(1),",
    "category_explanation VARCHAR(255),",
    "publisher_profile_id NUMERIC(20),",
    "is_draft VARCHAR(1),",
    "PRIMARY KEY (opportunity_id)",
    ")",
]

EXPECTED_NONLOCAL_OPPORTUNITY_SQL = [
    "CREATE FOREIGN TABLE IF NOT EXISTS __[SCHEMA_grants].topportunity (",
    "opportunity_id NUMERIC(20) OPTIONS (key 'true') NOT NULL,",
    "oppnumber VARCHAR(40),",
    "revision_number NUMERIC(20),",
    "opptitle VARCHAR(255),",
    "owningagency VARCHAR(255),",
    "publisheruid VARCHAR(255),",
    "listed CHAR(1),",
    "oppcategory CHAR(1),",
    "initial_opportunity_id NUMERIC(20),",
    "modified_comments VARCHAR(2000),",
    "created_date DATE,",
    "last_upd_date DATE,",
    "creator_id VARCHAR(50),",
    "last_upd_id VARCHAR(50),",
    "flag_2006 CHAR(1),",
    "category_explanation VARCHAR(255),",
    "publisher_profile_id NUMERIC(20),",
    "is_draft VARCHAR(1)",
    ") SERVER grants OPTIONS (schema 'EGRANTSADMIN', table 'TOPPORTUNITY')",
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
    "id INTEGER NOT NULL,",
    "description TEXT,",
    "PRIMARY KEY (id)",
    ")",
]
EXPECTED_NONLOCAL_TEST_SQL = [
    "CREATE FOREIGN TABLE IF NOT EXISTS __[SCHEMA_schema1].test_table (",
    "id INTEGER OPTIONS (key 'true') NOT NULL,",
    "description TEXT",
    ") SERVER grants OPTIONS (schema 'EGRANTSADMIN', table 'TEST_TABLE')",
]


@pytest.mark.parametrize(
    "table,is_local,expected_sql",
    [
        (TEST_TABLE, True, EXPECTED_LOCAL_TEST_SQL),
        (TEST_TABLE, False, EXPECTED_NONLOCAL_TEST_SQL),
        (
            src.db.foreign.metadata.tables["grants.topportunity"],
            True,
            EXPECTED_LOCAL_OPPORTUNITY_SQL,
        ),
        (
            src.db.foreign.metadata.tables["grants.topportunity"],
            False,
            EXPECTED_NONLOCAL_OPPORTUNITY_SQL,
        ),
    ],
)
def test_build_sql(table, is_local, expected_sql, test_foreign_schema):
    sql = build_sql(table, is_local, test_foreign_schema)

    assert re.split(r"\s*\n\s*", sql) == expected_sql
