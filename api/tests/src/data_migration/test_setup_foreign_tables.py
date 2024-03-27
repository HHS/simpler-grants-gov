import pytest

from src.data_migration.setup_foreign_tables import OPPORTUNITY_COLUMNS, Column, build_sql

EXPECTED_LOCAL_OPPORTUNITY_SQL = (
    "CREATE TABLE IF NOT EXISTS {}.foreign_topportunity "
    "(OPPORTUNITY_ID numeric(20) CONSTRAINT TOPPORTUNITY_pkey PRIMARY KEY NOT NULL,"
    "OPPNUMBER character varying (40),"
    "REVISION_NUMBER numeric(20),"
    "OPPTITLE character varying (255),"
    "OWNINGAGENCY character varying (255),"
    "PUBLISHERUID character varying (255),"
    "LISTED CHAR(1),"
    "OPPCATEGORY CHAR(1),"
    "INITIAL_OPPORTUNITY_ID numeric(20),"
    "MODIFIED_COMMENTS character varying (2000),"
    "CREATED_DATE DATE,"
    "LAST_UPD_DATE DATE,"
    "CREATOR_ID character varying (50),"
    "LAST_UPD_ID character varying (50),"
    "FLAG_2006 CHAR(1),"
    "CATEGORY_EXPLANATION character varying (255),"
    "PUBLISHER_PROFILE_ID numeric(20),"
    "IS_DRAFT character varying (1))"
)

EXPECTED_NONLOCAL_OPPORTUNITY_SQL = (
    "CREATE FOREIGN TABLE IF NOT EXISTS {}.foreign_topportunity "
    "(OPPORTUNITY_ID numeric(20) OPTIONS (key 'true') NOT NULL,"
    "OPPNUMBER character varying (40),"
    "REVISION_NUMBER numeric(20),"
    "OPPTITLE character varying (255),"
    "OWNINGAGENCY character varying (255),"
    "PUBLISHERUID character varying (255),"
    "LISTED CHAR(1),"
    "OPPCATEGORY CHAR(1),"
    "INITIAL_OPPORTUNITY_ID numeric(20),"
    "MODIFIED_COMMENTS character varying (2000),"
    "CREATED_DATE DATE,"
    "LAST_UPD_DATE DATE,"
    "CREATOR_ID character varying (50),"
    "LAST_UPD_ID character varying (50),"
    "FLAG_2006 CHAR(1),"
    "CATEGORY_EXPLANATION character varying (255),"
    "PUBLISHER_PROFILE_ID numeric(20),"
    "IS_DRAFT character varying (1))"
    " SERVER grants OPTIONS (schema 'EGRANTSADMIN', table 'TOPPORTUNITY')"
)


TEST_COLUMNS = [
    Column("ID", "integer", is_nullable=False, is_primary_key=True),
    Column("DESCRIPTION", "text"),
]
EXPECTED_LOCAL_TEST_SQL = (
    "CREATE TABLE IF NOT EXISTS {}.foreign_test_table "
    "(ID integer CONSTRAINT TEST_TABLE_pkey PRIMARY KEY NOT NULL,"
    "DESCRIPTION text)"
)
EXPECTED_NONLOCAL_TEST_SQL = (
    "CREATE FOREIGN TABLE IF NOT EXISTS {}.foreign_test_table "
    "(ID integer OPTIONS (key 'true') NOT NULL,"
    "DESCRIPTION text)"
    " SERVER grants OPTIONS (schema 'EGRANTSADMIN', table 'TEST_TABLE')"
)


@pytest.mark.parametrize(
    "table_name,columns,is_local,expected_sql",
    [
        ("TEST_TABLE", TEST_COLUMNS, True, EXPECTED_LOCAL_TEST_SQL),
        ("TEST_TABLE", TEST_COLUMNS, False, EXPECTED_NONLOCAL_TEST_SQL),
        ("TOPPORTUNITY", OPPORTUNITY_COLUMNS, True, EXPECTED_LOCAL_OPPORTUNITY_SQL),
        ("TOPPORTUNITY", OPPORTUNITY_COLUMNS, False, EXPECTED_NONLOCAL_OPPORTUNITY_SQL),
    ],
)
def test_build_sql(table_name, columns, is_local, expected_sql, test_api_schema):
    sql = build_sql(table_name, columns, is_local, test_api_schema)

    assert sql == expected_sql.format(test_api_schema)
