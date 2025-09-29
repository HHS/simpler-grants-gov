#!/usr/bin/env python3
"""
DEPRECATED: This CLI tool has been replaced with Flask CLI commands.

Please use the Flask CLI instead:

    # Generate XML from JSON (form-agnostic)
    flask task generate-xml --json '{"field": "value"}' --form SF424_4_0

    # Run XML validation tests
    flask task validate-xml-generation

For more options:
    flask task generate-xml --help
    flask task validate-xml-generation --help

To use the validator tool directly:
    python tool/xml_validator.py
"""

import sys

print(__doc__)
sys.exit(1)