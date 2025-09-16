#!/usr/bin/env python3
"""
Simple CLI tool for generating SF-424 XML from JSON input.
"""

import argparse
import json
import sys
from typing import Any

# Add the src directory to Python path for imports
sys.path.insert(0, '../src')

from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.models import XMLGenerationRequest

def get_example_json() -> dict[str, Any]:
    """Return a minimal example JSON for SF-424."""
    return {
        "submission_type": "Application",
        "application_type": "New",
        "date_received": "2025-01-01",
        "organization_name": "Example Organization",
        "employer_taxpayer_identification_number": "123456789",
        "sam_uei": "TEST12345678",
        "applicant_address": {
            "street1": "123 Main St",
            "city": "Washington",
            "state": "DC: District of Columbia",
            "zip_postal_code": "20001",
            "country": "USA: UNITED STATES",
        },
        "phone_number": "555-123-4567",
        "email": "test@example.org",
        "applicant_type_code": ["A: State Government"],
        "agency_name": "Test Agency",
        "funding_opportunity_number": "TEST-FON-2024-001",
        "funding_opportunity_title": "Test Funding Opportunity",
        "project_title": "Example Project Title",
        "congressional_district_applicant": "DC-00",
        "congressional_district_program_project": "DC-00",
        "project_start_date": "2025-04-01",
        "project_end_date": "2026-03-31",
        "federal_estimated_funding": "100000.00",
        "applicant_estimated_funding": "0.00",
        "state_estimated_funding": "0.00",
        "local_estimated_funding": "0.00",
        "other_estimated_funding": "0.00",
        "program_income_estimated_funding": "0.00",
        "total_estimated_funding": "100000.00",
        "state_review": "c. Program is not covered by E.O. 12372.",
        "delinquent_federal_debt": False,
        "certification_agree": True,
        "authorized_representative": {"first_name": "John", "last_name": "Doe"},
        "authorized_representative_title": "CEO",
        "authorized_representative_phone_number": "555-123-4567",
        "authorized_representative_email": "john@example.org",
        "aor_signature": "John Doe Signature",
        "date_signed": "2025-01-15",
    }

def generate_xml_from_json(json_data: dict[str, Any], pretty_print: bool = True) -> str:
    """Generate XML from JSON data using the SF-424 transformation rules."""
    try:
        # Create the XML generation service
        service = XMLGenerationService()
        
        # Create the request
        request = XMLGenerationRequest(
            application_data=json_data,
            form_name="SF424_4_0",
            pretty_print=pretty_print
        )
        
        # Generate XML
        response = service.generate_xml(request)
        
        if response.success:
            return response.xml_data or ""
        else:
            raise Exception(f"XML generation failed: {response.error_message}")
            
    except Exception as e:
        raise Exception(f"Error generating XML: {str(e)}")

def main():
    """Main CLI function."""
    parser = argparse.ArgumentParser(
        description="Generate SF-424 XML from JSON input",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Show example JSON
    python tool/xml_cli.py --example
    
    # Generate from JSON string
    python tool/xml_cli.py --json '{"organization_name": "Test Org"}'
    
    # Generate from file
    python tool/xml_cli.py --file input.json
        """
    )
    
    # Input options (mutually exclusive)
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument(
        "--json", 
        help="JSON string input"
    )
    input_group.add_argument(
        "--file", 
        help="JSON file path"
    )
    input_group.add_argument(
        "--stdin", 
        action="store_true", 
        help="Read JSON from stdin"
    )
    input_group.add_argument(
        "--example", 
        action="store_true", 
        help="Show example JSON and exit"
    )
    
    # Output options
    parser.add_argument(
        "--compact", 
        action="store_true", 
        help="Generate compact XML (no pretty printing)"
    )
    parser.add_argument(
        "--output", 
        help="Output file path (default: stdout)"
    )
    
    args = parser.parse_args()
    
    try:
        # Handle example request
        if args.example:
            example_json = get_example_json()
            print(json.dumps(example_json, indent=2))
            return
        
        # Read JSON input
        if args.json:
            json_data = json.loads(args.json)
        elif args.file:
            with open(args.file, 'r') as f:
                json_data = json.load(f)
        elif args.stdin:
            json_data = json.load(sys.stdin)
        else:
            parser.error("No input specified")
        
        # Generate XML
        pretty_print = not args.compact
        xml_output = generate_xml_from_json(json_data, pretty_print)
        
        # Output XML
        if args.output:
            with open(args.output, 'w') as f:
                f.write(xml_output)
            print(f"XML written to: {args.output}", file=sys.stderr)
        else:
            print(xml_output)
            
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}", file=sys.stderr)
        sys.exit(1)
    except FileNotFoundError as e:
        print(f"File not found: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
