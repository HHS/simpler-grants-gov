import json
import os

import boto3
from pg8000.native import Connection, identifier


def connect_as_master_user() -> Connection:
    user = os.environ["DB_USER"]
    host = os.environ["DB_HOST"]
    port = os.environ["DB_PORT"]
    database = os.environ["DB_NAME"]
    password = get_master_password()

    print(f"Connecting to database: {user=} {host=} {port=} {database=}")
    return Connection(
        user=user,
        host=host,
        port=port,
        database=database,
        password=password,
        ssl_context=True,
    )


def get_master_password() -> str:
    ssm = boto3.client("ssm", region_name=os.environ["AWS_REGION"])
    param_name = os.environ["DB_PASSWORD_PARAM_NAME"]
    print(f"Fetching password from parameter store:\n{param_name}")
    result = json.loads(
        ssm.get_parameter(Name=param_name, WithDecryption=True)["Parameter"]["Value"]
    )
    return result["password"]


def connect_using_iam(user: str) -> Connection:
    client = boto3.client("rds")
    host = os.environ["DB_HOST"]
    port = os.environ["DB_PORT"]
    database = os.environ["DB_NAME"]
    token = client.generate_db_auth_token(DBHostname=host, Port=port, DBUsername=user)
    print(f"Connecting to database: {user=} {host=} {port=} {database=}")
    return Connection(
        user=user,
        host=host,
        port=port,
        database=database,
        password=token,
        ssl_context=True,
    )


def execute(conn: Connection, query: str, print_query: bool = True):
    if print_query:
        print(f"{conn.user.decode('utf-8')}> {query}")
    return conn.run(query)
