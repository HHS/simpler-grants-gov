import logging
from dataclasses import dataclass

import pytest

from src.adapters.db.clients.postgres_client import get_connection_parameters, verify_ssl
from src.adapters.db.clients.postgres_config import get_db_config


@dataclass
class DummyPgConn:
    ssl_in_use: bool


class DummyConnectionInfo:
    def __init__(self, ssl_in_use):
        self.pgconn = DummyPgConn(ssl_in_use)


def test_verify_ssl(caplog):
    caplog.set_level(logging.INFO)  # noqa: B1

    conn_info = DummyConnectionInfo(True)
    verify_ssl(conn_info)

    assert caplog.messages == ["database connection is using SSL"]
    assert caplog.records[0].levelname == "INFO"


def test_verify_ssl_not_in_use(caplog):
    caplog.set_level(logging.INFO)  # noqa: B1

    conn_info = DummyConnectionInfo(False)
    verify_ssl(conn_info)

    assert caplog.messages == ["database connection is not using SSL"]
    assert caplog.records[0].levelname == "WARNING"


def test_get_connection_parameters(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("DB_SSL_MODE")
    db_config = get_db_config()
    conn_params = get_connection_parameters(db_config)

    assert conn_params == dict(
        host=db_config.host,
        dbname=db_config.name,
        user=db_config.username,
        password=db_config.password,
        port=db_config.port,
        connect_timeout=10,
        sslmode="require",
    )
