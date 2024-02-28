import pytest

from src.data_migration.setup_foreign_tables import Constants, build_sql

EXPECTED_LOCAL_OPPORTUNITY_SQL = "CREATE TABLE IF NOT EXISTS foreign_topportunity (OPPORTUNITY_ID numeric(20) CONSTRAINT TOPPORTUNITY_pkey PRIMARY KEY,OPPNUMBER character varying (40),REVISION_NUMBER numeric(20),OPPTITLE character varying (255),OWNINGAGENCY character varying (255),PUBLISHERUID character varying (255),LISTED CHAR(1),OPPCATEGORY CHAR(1),INITIAL_OPPORTUNITY_ID numeric(20),MODIFIED_COMMENTS character varying (2000),CREATED_DATE DATE,LAST_UPD_DATE DATE,CREATOR_ID character varying (50),LAST_UPD_ID character varying (50),FLAG_2006 CHAR(1),CATEGORY_EXPLANATION character varying (255),PUBLISHER_PROFILE_ID numeric(20),IS_DRAFT character varying (1))"
EXPECTED_NONLOCAL_OPPORTUNITY_SQL = "CREATE FOREIGN TABLE IF NOT EXISTS foreign_topportunity (OPPORTUNITY_ID numeric(20) OPTIONS (key 'true'),OPPNUMBER character varying (40),REVISION_NUMBER numeric(20),OPPTITLE character varying (255),OWNINGAGENCY character varying (255),PUBLISHERUID character varying (255),LISTED CHAR(1),OPPCATEGORY CHAR(1),INITIAL_OPPORTUNITY_ID numeric(20),MODIFIED_COMMENTS character varying (2000),CREATED_DATE DATE,LAST_UPD_DATE DATE,CREATOR_ID character varying (50),LAST_UPD_ID character varying (50),FLAG_2006 CHAR(1),CATEGORY_EXPLANATION character varying (255),PUBLISHER_PROFILE_ID numeric(20),IS_DRAFT character varying (1)) SERVER grants OPTIONS (schema 'EGRANTSADMIN', table 'TOPPORTUNITY')"


@pytest.mark.parametrize(
    "columns,is_local,expected_sql",
    [
        (Constants.OPPORTUNITY_COLUMNS, True, EXPECTED_LOCAL_OPPORTUNITY_SQL),
        (Constants.OPPORTUNITY_COLUMNS, False, EXPECTED_NONLOCAL_OPPORTUNITY_SQL),
    ],
)
def test_build_sql(columns, is_local, expected_sql):
    sql = build_sql("TOPPORTUNITY", columns, is_local)

    assert sql == expected_sql
