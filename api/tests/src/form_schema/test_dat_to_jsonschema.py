import os

from src.form_schema.dat_to_jsonschema import parse_xls_to_schema


def test_real_file():
    """Test parsing a real XLS file"""
    # Get the directory of the current test file
    test_dir = os.path.dirname(os.path.abspath(__file__))

    # Path to the XLS file in the same directory
    xls_path = os.path.join(test_dir, "SF424_Individual_2_0-V2.0_F668.xls")

    # Parse the file
    schema = parse_xls_to_schema(xls_path)

    # Basic validation of the schema
    assert schema is not None
    assert "type" in schema
    assert schema["type"] == "object"
    assert "properties" in schema

    # Check that we have at least some properties
    assert len(schema["properties"]) > 0

    # Additional assertions for a successful parse
    assert "required" in schema, "Schema is missing required fields list"
    assert isinstance(schema["required"], list), "Required fields should be a list"


def test_real_file_f723():
    """Test parsing a real XLS file"""
    # Get the directory of the current test file
    test_dir = os.path.dirname(os.path.abspath(__file__))

    # Path to the XLS file in the same directory
    xls_path = os.path.join(test_dir, "PerformanceSite_4_0-V4.0_F723.xls")

    # Parse the file
    schema = parse_xls_to_schema(xls_path)

    # Basic validation of the schema
    assert schema is not None
    assert "type" in schema
    assert schema["type"] == "object"
    assert "properties" in schema

    # Check that we have at least some properties
    assert len(schema["properties"]) > 0

    # Additional assertions for a successful parse
    assert "required" in schema, "Schema is missing required fields list"
    assert isinstance(schema["required"], list), "Required fields should be a list"
