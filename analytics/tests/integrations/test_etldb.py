"""Tests the code in integrations/etldb.py."""

import sqlalchemy
from analytics.integrations.etldb.etldb import EtlDb


class TestEtlDb:
    """Test EtlDb methods."""

    TEST_FILE_1 = "./tests/etldb_test_01.json"

    def test_instantiate_with_effective_date(self):
        """Class method should return the correctly instantiated object."""
        effective_date = "2024-11-18"
        etldb = EtlDb(effective_date)

        assert etldb.effective_date == effective_date

    def test_database_connection(self):
        """Class method should return database connection object."""
        etldb = EtlDb()
        connection = etldb.connection()

        assert isinstance(connection, sqlalchemy.Connection)

    def test_schema_versioning(self):
        """Class methods should return appropriate values."""
        etldb = EtlDb()
        has_versioning = etldb.schema_versioning_exists()
        current_version = etldb.get_schema_version()

        if has_versioning:
            assert current_version >= 2
        else:
            assert current_version <= 1

    def test_set_version_number(self):
        """Class method should successfully update version."""
        etldb = EtlDb()
        if not etldb.schema_versioning_exists():
            return

        original_version = etldb.get_schema_version()
        next_version = original_version + 1
        result = etldb.set_schema_version(next_version)

        assert result is True
        assert etldb.get_schema_version() == next_version

        # revert to keep testing env in same state
        etldb.revert_to_schema_version(original_version)

    def test_set_bad_version_number(self):
        """Class method should not update version."""
        etldb = EtlDb()
        if not etldb.schema_versioning_exists():
            return

        current_version = etldb.get_schema_version()
        previous_version = current_version - 1
        result = etldb.set_schema_version(previous_version)

        assert result is False
        assert etldb.get_schema_version() == current_version

    def test_revert_to_version_number(self):
        """Class method should successfully update version."""
        etldb = EtlDb()
        if not etldb.schema_versioning_exists():
            return

        original_version = etldb.get_schema_version()
        previous_version = original_version - 1
        result = etldb.revert_to_schema_version(previous_version)

        assert result is True
        assert etldb.get_schema_version() == previous_version

        # revert the revert to keep testing env in same state
        etldb.set_schema_version(original_version)

    def test_revert_to_bad_version_number(self):
        """Class method should successfully update version."""
        etldb = EtlDb()
        if not etldb.schema_versioning_exists():
            return

        original_version = etldb.get_schema_version()
        previous_version = -99
        result = etldb.revert_to_schema_version(previous_version)

        assert result is False
        assert etldb.get_schema_version() == original_version
