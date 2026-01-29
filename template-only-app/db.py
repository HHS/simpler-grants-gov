import logging
import os

import boto3
import psycopg
import psycopg.conninfo

logger = logging.getLogger()


def get_db_connection():
    host = os.environ.get("DB_HOST")
    port = os.environ.get("DB_PORT")
    user = os.environ.get("DB_USER")

    # Tokens last for 15 minutes, so normally you wouldn't need to generate
    # an auth token every time you create a new connection, but we do that
    # here to keep the example app simple.
    password = get_db_token(host, port, user)
    dbname = os.environ.get("DB_NAME")

    conninfo = psycopg.conninfo.make_conninfo(
        host=host, port=port, user=user, password=password, dbname=dbname
    )

    conn = psycopg.connect(conninfo)
    return conn


def get_db_token(host, port, user):
    # gets the credentials from .aws/credentials
    logger.info("Getting RDS client")
    client = boto3.client("rds")

    logger.info("Generating auth token for user %s", user)
    token = client.generate_db_auth_token(DBHostname=host, Port=port, DBUsername=user)
    return token
