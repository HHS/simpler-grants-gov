"""Constants for XML generation services.

This module contains shared constants, regex patterns, and other values
used across the XML generation functionality.
"""

# Currency validation regex from SF-424A form schema
# Allows: empty string, integers, decimals with exactly 2 places, decimals starting with dot
CURRENCY_REGEX = r"^\d*([.]\d{2})?$"

CURRENCY_REGEX_WITH_NEGATIVES = r"^(-)?\d*([.]\d{2})?$"

# Grants.gov YesNoDataType constants from GlobalLibrary-V2.0.xsd
YES_VALUE = "Y: Yes"
NO_VALUE = "N: No"
