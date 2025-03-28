import os

import pytest

from src.form_schema.csv_to_jsonschema import csv_to_jsonschema


@pytest.fixture
def csv_file_content():
    # Path to the test CSV file
    test_dir = os.path.dirname(os.path.abspath(__file__))

    # Path to the csv file in the same directory
    csv_file_path = os.path.join(test_dir, "dat.csv")

    with open(csv_file_path, "r", encoding="utf-8") as f:
        return f.read()


@pytest.fixture
def expected_schema_keys():
    # Expected top-level keys in the JSON schema
    return ["type", "required", "properties"]


@pytest.fixture
def expected_fields():
    # A sample of fields we expect to find in the schema
    return [
        "FirstName",
        "LastName",
        "City",
        "Country",
        "citizenship",
    ]


def test_csv_to_jsonschema_creates_valid_schema(csv_file_content, expected_schema_keys):
    """Test that the function generates a schema with expected structure."""
    # Run the conversion
    schema = csv_to_jsonschema(csv_file_content)

    # Check schema has expected top-level keys
    for key in expected_schema_keys:
        assert key in schema

    # Verify schema follows JSON Schema standard
    assert schema["type"] == "object"
    assert isinstance(schema["properties"], dict)
    assert isinstance(schema["required"], list)


def test_csv_to_jsonschema_contains_expected_fields(csv_file_content, expected_fields):
    """Test that the generated schema contains expected fields."""
    schema = csv_to_jsonschema(csv_file_content)

    print(schema)
    # Look for each field in the schema properties
    for field in expected_fields:
        # Fields might be in the main schema or in a section
        field_found = False

        # Check if field is in top-level properties
        if field in schema["properties"]:
            field_found = True

        # Check if field is in any section
        for _, section in schema["properties"].items():
            if isinstance(section, dict) and "properties" in section:
                if field in section["properties"]:
                    field_found = True
                    break

        assert field_found, f"Field {field} not found in schema"


def test_required_fields_are_marked_correctly(csv_file_content):
    """Test that required fields are properly marked in the schema."""
    schema = csv_to_jsonschema(csv_file_content)

    # Known required fields from CSV
    known_required_fields = ["FirstName", "LastName", "AuthorizedRepresentativeEmail"]

    # Check if these fields are marked as required
    for field in known_required_fields:
        field_required = False

        # Check if field is required at top level
        if field in schema.get("required", []):
            field_required = True

        # Check if field is required in any section
        for _, section in schema["properties"].items():
            if isinstance(section, dict) and "required" in section:
                if field in section["required"]:
                    field_required = True
                    break

        assert field_required, f"Field {field} should be marked as required"


def test_enum_fields_have_correct_values(csv_file_content):
    """Test that enum fields have the correct values."""
    schema = csv_to_jsonschema(csv_file_content)

    # Test Country field which should have enum values
    # Find the field in the schema
    country_field = None

    # Check in applicant_information section
    country_field = schema["properties"]["Country"]

    assert country_field is not None, "Country field not found"
    assert "enum" in country_field, "Country field should have enum values"
    assert isinstance(country_field["enum"], list), "Enum values should be a list"

    # Test prefix field which should have Mr., Mrs., etc.
    prefix_field = None
    if "applicant_information" in schema["properties"]:
        section = schema["properties"]["applicant_information"]
        if "PrefixName" in section.get("properties", {}):
            prefix_field = section["properties"]["PrefixName"]

    if prefix_field and "enum" in prefix_field:
        expected_prefixes = ["Mr.", "Mrs.", "Miss", "Ms.", "Dr.", "Rev."]
        for prefix in expected_prefixes:
            assert prefix in prefix_field["enum"], f"Expected prefix {prefix} not found"


def test_date_fields_have_correct_format(csv_file_content):
    """Test that date fields have the correct format."""
    schema = csv_to_jsonschema(csv_file_content)

    # Find fields that should be dates
    date_field_names = ["FundingPeriodStartDate", "FundingPeriodEndDate"]

    for field_name in date_field_names:
        field = schema["properties"][field_name]

        assert field is not None, f"Date field {field_name} not found"
        assert "format" in field, f"Field {field_name} should have format specified"
        assert field["format"] == "date", f"Field {field_name} should have format 'date'"
