"""XML validation module for XSD compliance testing.

This module runs outside the main test suite to avoid XSD file dependencies
in regular unit tests. It provides tools to validate generated XML against
Grants.gov XSD schemas.
"""

from .test_runner import ValidationTestRunner
from .xsd_validator import XSDValidator

__all__ = ["XSDValidator", "ValidationTestRunner"]
