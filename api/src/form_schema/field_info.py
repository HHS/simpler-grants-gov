import logging
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class FieldInfo:
    id: str
    required: bool
    data_type: str
    type: str
    title: str
    label: str
    min_value: int | None = None
    max_value: int | None = None
    list_of_values: list[str] | None = None
    help_tip: str | None = None
    min_occurrences: int | None = None
    is_nullable: bool = False

    @staticmethod
    def parse_numeric(value: str | None) -> int | None:
        """
        Convert a string to a numeric value (int or float).

        Args:
            value: String value to convert to numeric

        Returns:
            Integer or float value, or None if input is empty/None
        """
        if value is None or value.strip() == "":
            return None

        # Remove any currency symbols, commas, and whitespace
        cleaned_value: str = value.strip().replace("$", "").replace(",", "").replace(" ", "")

        try:
            # Try converting to int first
            num_value = int(Decimal(cleaned_value))
            return num_value
        except ValueError:
            # Log the error or handle it as needed
            logger.warning(f"Warning: Could not convert '{value}' to a numeric value")
            return None

    @staticmethod
    def parse_list(value: str | None) -> list[str] | None:
        """
        Convert a string containing a list of values to a Python list.

        Args:
            value: String value containing delimited list items (e.g., "item1,item2,item3")

        Returns:f
            List of strings, or None if input is empty/None
        """
        if value is None or value.strip() == "":
            return None

        # Split by comma and strip whitespace from each item
        items = [v.strip() for v in value.split(";") if v.strip()]

        # Filter out empty items
        return [item for item in items if item]

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> FieldInfo:
        """Create a FieldInfo instance from a dictionary."""
        id = data.get("Agency FieldName", "") or data.get("Agency Field Name", "")
        return cls(
            id=id,
            title=data.get("Field ID", "").strip(),
            required=data.get("Required?", "").strip().lower() == "yes",
            data_type=data.get("Data Type", "").strip(),
            type=data.get("Field Implementation", "").strip(),
            label=data.get("Field Label", "").strip(),
            min_value=cls.parse_numeric(data.get("Min  # of Chars or Min Value", "").strip()),
            max_value=cls.parse_numeric(data.get("Max # of Chars or Max Value", "").strip()),
            list_of_values=cls.parse_list(data.get("List of Values", "").strip()),
            help_tip=data.get("Help Tip", "").strip(),
            min_occurrences=cls.parse_numeric(data.get("Minimum Occurrences", "").strip()),
            is_nullable=data.get("Minimum Occurrences", "").strip() == "0",
        )
