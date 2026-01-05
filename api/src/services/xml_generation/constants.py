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
HEADER_NAMESPACES = {
    "header": "http://apply.grants.gov/system/Header-V1.0",
    "glob": "http://apply.grants.gov/system/Global-V1.0",
}

FOOTER_NAMESPACES = {
    "footer": "http://apply.grants.gov/system/Footer-V1.0",
    "glob": "http://apply.grants.gov/system/Global-V1.0",
}

# Namespaces for the main GrantApplication XML
GRANTS_GOV_NAMESPACES = {
    "header": "http://apply.grants.gov/system/Header-V1.0",
    "footer": "http://apply.grants.gov/system/Footer-V1.0",
    "glob": "http://apply.grants.gov/system/Global-V1.0",
    "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
    "att": "http://apply.grants.gov/system/Attachments-V1.0",
    "grant": "http://apply.grants.gov/system/GrantsCommonTypes-V1.0",
    "xsi": "http://www.w3.org/2001/XMLSchema-instance",
}
