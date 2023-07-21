import logging

import pytest

from src.adapters.db.clients.postgres_client import get_connection_parameters, verify_ssl
from src.adapters.db.clients.postgres_config import get_db_config


class DummyConnectionInfo:
    def __init__(self, ssl_in_use, attributes):
        self.ssl_in_use = ssl_in_use
        self.attributes = attributes
        self.ssl_attribute_names = tuple(attributes.keys())

    def ssl_attribute(self, name):
        return self.attributes[name]


def test_verify_ssl(caplog):
    caplog.set_level(logging.INFO)  # noqa: B1

    conn_info = DummyConnectionInfo(True, {"protocol": "ABCv3", "key_bits": "64", "cipher": "XYZ"})
    verify_ssl(conn_info)

    assert caplog.messages == [
        "database connection is using SSL: protocol ABCv3, key_bits 64, cipher XYZ"
    ]
    assert caplog.records[0].levelname == "INFO"


def test_verify_ssl_not_in_use(caplog):
    caplog.set_level(logging.INFO)  # noqa: B1

    conn_info = DummyConnectionInfo(False, {})
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
        options=f"-c search_path={db_config.db_schema}",
        connect_timeout=3,
        sslmode="require",
    )
