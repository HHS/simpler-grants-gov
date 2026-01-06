"""Constants for XML generation services.

This module contains shared constants, regex patterns, and other values
used across the XML generation functionality.
"""

# Currency validation regex from SF-424A form schema
# Allows: empty string, integers, decimals with exactly 2 places, decimals starting with dot
CURRENCY_REGEX = r"^(-)?\d*([.]\d{2})?$"

# Grants.gov YesNoDataType constants from GlobalLibrary-V2.0.xsd
YES_VALUE = "Y: Yes"
NO_VALUE = "N: No"

# Base URL for schema locations
# This matches the legacy Grants.gov URL structure
SCHEMA_LOCATION_BASE_URL = "https://apply07.grants.gov/apply/opportunities/schemas/applicant"

# Namespace Definitions
# These match the legacy Grants.gov XML structures


class Namespace:
    """Type-safe namespace constants for Grants.gov XML generation."""

    # Header namespaces
    HEADER = "http://apply.grants.gov/system/Header-V1.0"

    # Footer namespaces
    FOOTER = "http://apply.grants.gov/system/Footer-V1.0"

    # Global namespaces
    GLOB = "http://apply.grants.gov/system/Global-V1.0"
    GLOB_LIB = "http://apply.grants.gov/system/GlobalLibrary-V2.0"

    # Attachments namespace
    ATT = "http://apply.grants.gov/system/Attachments-V1.0"

    # Grant common types namespace
    GRANT = "http://apply.grants.gov/system/GrantsCommonTypes-V1.0"

    # XML Schema instance namespace
    XSI = "http://www.w3.org/2001/XMLSchema-instance"


# Legacy dictionary-based access (kept for backward compatibility)
HEADER_NAMESPACES = {
    "header": Namespace.HEADER,
    "glob": Namespace.GLOB,
}

FOOTER_NAMESPACES = {
    "footer": Namespace.FOOTER,
    "glob": Namespace.GLOB,
}

# Namespaces for the main GrantApplication XML
GRANTS_GOV_NAMESPACES = {
    "header": Namespace.HEADER,
    "footer": Namespace.FOOTER,
    "glob": Namespace.GLOB,
    "globLib": Namespace.GLOB_LIB,
    "att": Namespace.ATT,
    "grant": Namespace.GRANT,
    "xsi": Namespace.XSI,
}
