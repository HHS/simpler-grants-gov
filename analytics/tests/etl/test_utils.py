"""Test the utility functions module."""

import json  # noqa: I001
from pathlib import Path

import pytest
from pydantic import BaseModel, ValidationError

from analytics.etl.utils import load_config


class MockConfig(BaseModel):
    """Mock config class."""

    param1: str
    param2: str


@pytest.fixture(name="valid_config_file")
def mock_valid_config_file(tmp_path: Path) -> Path:
    """Path to a valid config file."""
    # Create a temporary file with valid JSON data
    config_data = {"param1": "foo", "param2": "bar"}
    config_file = tmp_path / "valid_config.json"
    config_file.write_text(json.dumps(config_data))
    return config_file


@pytest.fixture(name="invalid_config_file")
def mock_invalid_config_file(tmp_path: Path) -> Path:
    """Path to an invalid config file."""
    # Create a temporary file with invalid JSON data
    config_data = {
        "database_url": "sqlite:///test.db",
        # Missing the required 'api_key' field
    }
    config_file = tmp_path / "invalid_config.json"
    config_file.write_text(json.dumps(config_data))
    return config_file


def test_load_valid_config(valid_config_file: Path):
    """Valid config should load successfully."""
    # Test that a valid config file loads successfully
    config = load_config(valid_config_file, MockConfig)
    assert config.param1 == "foo"
    assert config.param2 == "bar"


def test_load_invalid_config(invalid_config_file: Path):
    """Invalid config should raise an error."""
    # Test that an invalid config file raises a ValidationError
    with pytest.raises(ValidationError):
        load_config(invalid_config_file, MockConfig)
