import csv
import logging
import re
from typing import Any

from src.form_schema.field_info import FieldInfo
from src.form_schema.jsonschema_builder import JsonSchemaBuilder

logger = logging.getLogger(__name__)


def csv_to_jsonschema(csv_content: str) -> dict[str, Any]:
    """
    Convert a form definition CSV file to JSON Schema using JsonSchemaBuilder.

    Args:
        csv_file_path: Path to the CSV file containing form field definitions

    Returns:
        A dictionary representing the JSON Schema
    """
    # Initialize the main schema builder
    schema_builder = JsonSchemaBuilder()

    # Group fields by section for better organization
    sections: dict[str, list[FieldInfo]] = {}
    current_section = None

    reader = csv.DictReader(csv_content.splitlines())

    for row in reader:
        field_info = FieldInfo.from_dict(row)

        # Skip headers and non-data rows
        if (
            not field_info.id
            or field_info.id == "Field ID"
            or field_info.type in ["Label", "Button"]
        ):
            # Check if this might be a section header
            if field_info.label and "Header" in field_info.label:
                current_section = field_info.label.replace(" Header", "")
                sections[current_section] = []
            continue

        if current_section:
            sections.setdefault(current_section, []).append(field_info)
        else:
            # If no section is active, add directly to the schema
            add_field_to_builder(schema_builder, field_info)

    # Now process all sections and add them to the main schema
    for section_name, fields in sections.items():
        if not fields:
            continue

        # Create a section builder with title
        section_builder = JsonSchemaBuilder(title=section_name)

        # Add each field to the section builder
        for field_info in fields:
            add_field_to_builder(section_builder, field_info)

        # Create a sanitized section name for the property key
        section_key = re.sub(r"[^a-zA-Z0-9]", "_", section_name.lower())

        # Add the section as a sub-object to the main schema
        schema_builder.add_sub_object(section_key, False, section_builder)

    return schema_builder.build()


def add_field_to_builder(builder: JsonSchemaBuilder, field_info: FieldInfo) -> None:
    """Add a field to the appropriate JsonSchemaBuilder based on its type."""
    field_id = field_info.id
    required = field_info.required
    data_type = field_info.data_type
    field_type = field_info.type
    min_value = field_info.min_value
    max_value = field_info.max_value
    list_of_values = field_info.list_of_values
    help_tip = field_info.help_tip
    is_nullable = field_info.is_nullable

    # Use field_label as the title
    title = field_info.label

    # Determine field format
    format_value = None
    if data_type == "DATE":
        format_value = "date"
    elif "email" in field_id.lower():
        format_value = "email"

    skipped_types = ["FILE"]

    # Skip fields we define above. Default to String otherwise.
    if field_type in skipped_types:
        logger.info(f"Skipping field {field_id} of type {field_type}")
        return

    # Add appropriate property based on type
    if field_type == "Radio Group" or data_type == "LIST" or list_of_values:
        builder.add_string_property(
            field_id,
            is_nullable=is_nullable,
            is_required=required,
            title=title,
            description=help_tip,
            min_length=min_value,
            max_length=max_value,
            format=format_value,
            enum=list_of_values,
        )
    elif data_type == "DATE":
        builder.add_string_property(
            field_id,
            is_nullable=is_nullable,
            is_required=required,
            title=title,
            description=help_tip,
            format="date",
        )
    elif data_type == "AN":  # Alphanumeric
        builder.add_string_property(
            field_id,
            is_nullable=is_nullable,
            is_required=required,
            title=title,
            description=help_tip,
            min_length=min_value,
            max_length=max_value,
            format=format_value,
        )
    else:
        # Default to string
        builder.add_string_property(
            field_id,
            is_nullable=is_nullable,
            is_required=required,
            title=title,
            description=help_tip,
            min_length=min_value,
            max_length=max_value,
            format=format_value,
        )

    # Add description or help text to the property
    if help_tip:
        # We need to manually add description since it's not part of the builder API
        builder.properties[field_id]["description"] = help_tip
