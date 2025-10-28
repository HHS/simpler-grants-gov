import os

import pytest

from src.form_schema.csv_to_jsonschema import (
    _add_standard_definitions,
    add_field_to_builder,
    csv_to_jsonschema,
)
from src.form_schema.enums import CountryCode, StateCode
from src.form_schema.field_info import FieldInfo
from src.form_schema.jsonschema_builder import JsonSchemaBuilder


@pytest.fixture
def csv_file_content():
    # Path to the test CSV file
    test_dir = os.path.dirname(os.path.abspath(__file__))

    # Path to the csv file in the same directory
    csv_file_path = os.path.join(test_dir, "dat.csv")

    with open(csv_file_path, encoding="utf-8") as f:
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
    schema, _ = csv_to_jsonschema(csv_file_content)

    # Check schema has expected top-level keys
    for key in expected_schema_keys:
        assert key in schema

    # Verify schema follows JSON Schema standard
    assert schema["type"] == "object"
    assert isinstance(schema["properties"], dict)
    assert isinstance(schema["required"], list)


def test_csv_to_jsonschema_contains_expected_fields(csv_file_content, expected_fields):
    """Test that the generated schema contains expected fields."""
    schema, _ = csv_to_jsonschema(csv_file_content)

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
    schema, _ = csv_to_jsonschema(csv_file_content)

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
    schema, _ = csv_to_jsonschema(csv_file_content)

    # Test Country field which should have enum values
    # Find the field in the schema
    country_field = None

    # Check in applicant_information section
    country_field = schema["properties"]["Country"]

    assert country_field is not None, "Country field not found"
    assert country_field["$ref"] == "#/$defs/CountryCode", "Country field should have enum values"

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
    schema, _ = csv_to_jsonschema(csv_file_content)

    # Find fields that should be dates
    date_field_names = ["FundingPeriodStartDate", "FundingPeriodEndDate"]

    for field_name in date_field_names:
        field = schema["properties"][field_name]

        assert field is not None, f"Date field {field_name} not found"
        assert "format" in field, f"Field {field_name} should have format specified"
        assert field["format"] == "date", f"Field {field_name} should have format 'date'"


def test_ui_schema_has_correct_structure(csv_file_content):
    """Test that the UI schema has the expected structure."""
    _, ui_schema = csv_to_jsonschema(csv_file_content)

    # Verify UI schema is a list
    assert isinstance(ui_schema, list), "UI schema should be a list"

    # Verify it's not empty
    assert len(ui_schema) > 0, "UI schema should not be empty"

    # Verify each entry has correct structure
    for item in ui_schema:
        assert "type" in item, "Each UI schema item should have a 'type' field"
        assert "definition" in item, "Each UI schema item should have a 'definition' field"
        assert item["type"] == "field", "Each UI schema item should have type 'field'"
        assert item["definition"].startswith(
            "/properties/"
        ), "Definition should start with '/properties/'"

    assert ui_schema[0]["definition"] == "/properties/FederalAgency"


def test_state_and_country_fields_auto_detection():
    """
    Test that state and country fields automatically get references to the
    appropriate definitions in the JSON schema.
    """
    # Create a builder
    builder = JsonSchemaBuilder(title="Test Schema")

    _add_standard_definitions(builder)

    # Add various state and country fields with different naming patterns
    builder.add_string_property("state", False, True, title="State")
    builder.add_string_property("country", False, True, title="Country")
    builder.add_string_property(
        "homeState",
        False,
        False,
        title="Home State",
        enum=["50 US States, US possessions, territories, military codes"],
    )
    builder.add_string_property(
        "mailingState",
        False,
        False,
        title="Mailing State",
        enum=["50 US States, US possessions, territories, military codes"],
    )
    builder.add_string_property(
        "birthCountry", False, False, title="Birth Country", enum=["GENC Standard Ed3.0 Update 11"]
    )
    builder.add_string_property(
        "citizenshipCountry",
        False,
        False,
        title="Citizenship Country",
        enum=["GENC Standard Ed3.0 Update 11"],
    )

    # Add a regular strin   g field without auto-detection
    builder.add_string_property("city", False, True, title="City")

    builder.add_string_property(
        "preferredCountry",
        False,
        False,
        title="Preferred Country",
        enum=["GENC Standard Ed3.0 Update 11"],
    )

    # Build the schema
    schema = builder.build()

    # Verify $defs section contains our standard definitions
    assert "$defs" in schema
    assert "StateCode" in schema["$defs"]
    assert "CountryCode" in schema["$defs"]

    # Verify the definitions have the correct enum values
    assert "enum" in schema["$defs"]["StateCode"]
    assert schema["$defs"]["StateCode"]["enum"] == StateCode.list_values()
    assert "enum" in schema["$defs"]["CountryCode"]
    assert schema["$defs"]["CountryCode"]["enum"] == CountryCode.list_values()

    # Verify regular fields don't have references
    assert "$ref" not in schema["properties"]["city"]
    assert "type" in schema["properties"]["city"]
    assert schema["properties"]["city"]["type"] == "string"


def test_add_field_to_builder_state_country_references():
    """
    Test that add_field_to_builder correctly adds state and country fields
    as references to standard definitions.
    """
    # Create a builder
    builder = JsonSchemaBuilder(title="Test Fields")

    _add_standard_definitions(builder)

    # Create test field info objects
    state_field = FieldInfo(
        id="homeState",
        label="Home State",
        required=True,
        type="Text",
        data_type="AN",
        min_value=None,
        max_value=None,
        help_tip="Enter your home state",
        is_nullable=False,
        list_of_values="50 US States, US possessions, territories, military codes",
        title="Home State",
    )

    country_field = FieldInfo(
        id="birthCountry",
        label="Country of Birth",
        required=False,
        type="Text",
        data_type="AN",
        min_value=None,
        max_value=None,
        help_tip="Enter your country of birth",
        is_nullable=False,
        list_of_values="GENC Standard Ed3.0 Update 11",
        title="Country of Birth",
    )

    regular_field = FieldInfo(
        id="fullName",
        label="Full Name",
        required=True,
        type="Text",
        data_type="AN",
        list_of_values=None,
        min_value=None,
        max_value=None,
        help_tip="Enter your full name",
        is_nullable=False,
        title="Full Name",
    )

    # Add fields to the builder
    add_field_to_builder(builder, state_field)
    add_field_to_builder(builder, country_field)
    add_field_to_builder(builder, regular_field)

    # Build the schema
    schema = builder.build()

    # Verify $defs section exists with standard definitions
    assert "$defs" in schema
    assert "StateCode" in schema["$defs"]
    assert "CountryCode" in schema["$defs"]

    # Verify state field is added as a reference
    assert "homeState" in schema["properties"]
    assert "$ref" in schema["properties"]["homeState"]
    assert schema["properties"]["homeState"]["$ref"] == "#/$defs/StateCode"
    assert schema["properties"]["homeState"]["title"] == "Home State"
    assert "homeState" in schema["required"]

    # Verify country field is added as a reference
    assert "birthCountry" in schema["properties"]
    assert "$ref" in schema["properties"]["birthCountry"]
    assert schema["properties"]["birthCountry"]["$ref"] == "#/$defs/CountryCode"
    assert schema["properties"]["birthCountry"]["title"] == "Country of Birth"
    assert "birthCountry" not in schema["required"]  # Shouldn't be required

    # Verify regular field is NOT added as a reference
    assert "fullName" in schema["properties"]
    assert "$ref" not in schema["properties"]["fullName"]
    assert schema["properties"]["fullName"]["type"] == "string"
    assert schema["properties"]["fullName"]["title"] == "Full Name"
    assert "fullName" in schema["required"]


def test_add_field_to_builder_genc_country_detection():
    """
    Test that add_field_to_builder correctly identifies country fields
    based on GENC Standard in list_of_values.
    """
    from src.form_schema.csv_to_jsonschema import add_field_to_builder
    from src.form_schema.field_info import FieldInfo

    # Create a builder
    builder = JsonSchemaBuilder(title="GENC Test")

    # Create a field with GENC Standard in list_of_values
    genc_country_field = FieldInfo(
        id="nationalOrigin",  # Not ending with 'country'
        label="National Origin",
        required=True,
        type="Select",
        data_type="LIST",
        list_of_values=["GENC Standard Ed3.0 Update 11"],  # Contains GENC marker
        min_value=None,
        max_value=None,
        help_tip="Select your national origin",
        is_nullable=False,
        title="National Origin",
    )

    # Create a regular dropdown field
    regular_dropdown = FieldInfo(
        id="favoriteColor",
        label="Favorite Color",
        required=False,
        type="Select",
        data_type="LIST",
        list_of_values=["Red", "Green", "Blue"],  # No GENC marker
        min_value=None,
        max_value=None,
        help_tip="Select your favorite color",
        is_nullable=False,
        title="Favorite Color",
    )

    # Add fields to the builder
    add_field_to_builder(builder, genc_country_field)
    add_field_to_builder(builder, regular_dropdown)

    # Build the schema
    schema = builder.build()

    # Verify the GENC field is treated as a country reference
    assert "nationalOrigin" in schema["properties"]
    assert "$ref" in schema["properties"]["nationalOrigin"]
    assert schema["properties"]["nationalOrigin"]["$ref"] == "#/$defs/CountryCode"

    # Verify the regular dropdown is NOT treated as a reference
    assert "favoriteColor" in schema["properties"]
    assert "$ref" not in schema["properties"]["favoriteColor"]
    assert "enum" in schema["properties"]["favoriteColor"]
    assert schema["properties"]["favoriteColor"]["enum"] == ["Red", "Green", "Blue"]
