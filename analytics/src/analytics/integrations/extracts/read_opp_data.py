import logging
import os
from io import StringIO

import boto3
from urllib.parse import urlparse
import psycopg

from analytics.integrations.extracts.db_client import PostgresDBClient
from analytics.integrations.etldb.etldb import EtlDb



logger = logging.getLogger(__name__)




def get_s3_bucket(path):
    return urlparse(path).hostname


def _fetch_data(bucket, object_key):
    s3_client = boto3.client('s3')
    data = s3_client.get_object(Bucket=bucket, Key=object_key).read().decode('utf-8')

    return StringIO(data)


def _insert_data(conn, table, columns, data):
    logger.info(f"inserting data {table}")

    cursor= conn.connection.cursor()

    with open(data, "r") as f:
        query = f"""
                    COPY {table} ({', '.join(columns)}) FROM STDIN WITH (FORMAT CSV, DELIMITER ',', QUOTE '"', HEADER)
                """
        with cursor.copy(query) as copy:
            while data := f.read():
                copy.write(data)

        logger.info(f"Successfully loaded data from {data}")

    # conn.connection.commit()
    # fetch
    cursor.execute(f"select * from {table};")
    rows = cursor.fetchall()
    logger.info(f"Rows returned count: {len(rows)}")


LK_OPPORTUNITY_STATUS_COLS = (
    "OPPORTUNITY_STATUS_ID",
    "DESCRIPTION",
    "CREATED_AT",
    "UPDATED_AT",
)

LK_OPPORTUNITY_CATEGORY_COLS = (
    "OPPORTUNITY_CATEGORY_ID",
    "DESCRIPTION",
    "CREATED_AT",
    "UPDATED_AT",
)
OPPORTUNITY_COLS = (
    "OPPORTUNITY_ID",
    "OPPORTUNITY_NUMBER",
    "OPPORTUNITY_TITLE",
    "AGENCY_CODE",
    "OPPORTUNITY_CATEGORY_ID",
    "CATEGORY_EXPLANATION",
    "IS_DRAFT",
    "REVISION_NUMBER",
    "MODIFIED_COMMENTS",
    "PUBLISHER_USER_ID",
    "PUBLISHER_PROFILE_ID",
    "CREATED_AT",
    "UPDATED_AT",
)
OPOORTUNITY_SUMMARY_COLS = (
    "OPPORTUNITY_SUMMARY_ID",
    "OPPORTUNITY_ID",
    "SUMMARY_DESCRIPTION",
    "IS_COST_SHARING",
    "IS_FORECAST",
    "POST_DATE",
    "CLOSE_DATE",
    "CLOSE_DATE_DESCRIPTION",
    "ARCHIVE_DATE",
    "UNARCHIVE_DATE",
    "EXPECTED_NUMBER_OF_AWARDS",
    "ESTIMATED_TOTAL_PROGRAM_FUNDING",
    "AWARD_FLOOR",
    "AWARD_CEILING",
    "ADDITIONAL_INFO_URL",
    "ADDITIONAL_INFO_URL_DESCRIPTION",
    "FORECASTED_POST_DATE",
    "FORECASTED_CLOSE_DATE",
    "FORECASTED_CLOSE_DATE_DESCRIPTION",
    "FORECASTED_AWARD_DATE",
    "FORECASTED_PROJECT_START_DATE",
    "FISCAL_YEAR",
    "REVISION_NUMBER",
    "MODIFICATION_COMMENTS",
    "FUNDING_CATEGORY_DESCRIPTION",
    "APPLICANT_ELIGIBILITY_DESCRIPTION",
    "AGENCY_CODE",
    "AGENCY_NAME",
    "AGENCY_PHONE_NUMBER",
    "AGENCY_CONTACT_DESCRIPTION",
    "AGENCY_EMAIL_ADDRESS",
    "AGENCY_EMAIL_ADDRESS_DESCRIPTION",
    "IS_DELETED",
    "CAN_SEND_MAIL",
    "PUBLISHER_PROFILE_ID",
    "PUBLISHER_USER_ID",
    "UPDATED_BY",
    "CREATED_BY",
    "CREATED_AT",
    "UPDATED_AT",
    "VERSION_NUMBER"
)
CURRENT_OPPORTUNITY_SUMMARY_COLS = (
    "OPPORTUNITY_ID",
    "OPPORTUNITY_SUMMARY_ID",
    "OPPORTUNITY_STATUS_ID",
    "CREATED_AT",
    "UPDATED_AT"
)

MAP_TABLE_TO_COLS = {
    "lk_opportunity_status": LK_OPPORTUNITY_STATUS_COLS,
    "lk_opportunity_category": LK_OPPORTUNITY_CATEGORY_COLS,
    "opportunity": OPPORTUNITY_COLS,
    "opportunity_summary": OPOORTUNITY_SUMMARY_COLS,
    "current_opportunity_summary": CURRENT_OPPORTUNITY_SUMMARY_COLS,
}


def ingest_opportunity_data():
    s3_files_path = os.getenv("S3_FILE_PATH")
    bucket = get_s3_bucket(s3_files_path)
    key_prefix = urlparse(s3_files_path)[1:]

    # get connection to database
    etldb = EtlDb()
    # conn = etldb.connection() #CONNECTION OBJECT OF DB ENGINE

    opp_tables = ["lk_opportunity_status", "lk_opportunity_category", "opportunity", "opportunity_summary", "current_opportunity_summary"]

    with etldb.connection() as conn, conn.begin():
        for table in opp_tables:
            logger.info(f"Copying data for table: {table}")
            #
            # object_key = f"{key_prefix}/{table}.csv"
            # data = _fetch_data(bucket, object_key, table)

            current_directory = os.path.dirname(os.path.realpath(__file__))
            print(current_directory)
            file_name = f"{table}.csv"
            print(file_name)
            file_path = os.path.join(current_directory, file_name)
            print(file_path)

            _insert_data(conn, table, MAP_TABLE_TO_COLS[table], file_path) #data





if __name__ == "__main__":
    ingest_opportunity_data()





