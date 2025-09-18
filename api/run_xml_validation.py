#!/usr/bin/env python3
"""Standalone script to run XML validation tests against XSD schemas.

This script runs outside the main test suite to validate XML generation
against Grants.gov XSD schemas without requiring XSD files in the repo.

Usage:
    python run_xml_validation.py [--form FORM_NAME] [--output OUTPUT_FILE] [--cache-dir CACHE_DIR]
"""

import argparse
import logging
import sys
from pathlib import Path

# Add the src directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.services.xml_generation.validation.test_cases import (
    get_all_test_cases,
    get_test_cases_by_form,
)
from src.services.xml_generation.validation.test_runner import ValidationTestRunner


def setup_logging(verbose: bool = False) -> None:
    """Set up logging configuration."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def main() -> int:
    """Main entry point for the validation script."""
    parser = argparse.ArgumentParser(
        description="Run XML validation tests against XSD schemas",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run all validation tests
  python run_xml_validation.py

  # Run only SF-424 tests
  python run_xml_validation.py --form SF424_4_0

  # Save results to file
  python run_xml_validation.py --output validation_results.json

  # Use custom cache directory
  python run_xml_validation.py --cache-dir /tmp/xsd_cache
        """,
    )

    parser.add_argument(
        "--form",
        help="Form name to test (e.g., SF424_4_0). If not specified, runs all forms.",
    )
    parser.add_argument(
        "--xsd-url",
        help="XSD URL or local file path to use for validation. Overrides XSD URL from test cases.",
    )
    parser.add_argument(
        "--output",
        help="Output file to save results (JSON format)",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable verbose logging",
    )

    args = parser.parse_args()

    # Set up logging
    setup_logging(args.verbose)
    logger = logging.getLogger(__name__)

    try:
        # Get test cases
        if args.form:
            test_cases = get_test_cases_by_form(args.form)
            if not test_cases:
                logger.error(f"No test cases found for form: {args.form}")
                return 1
        else:
            test_cases = get_all_test_cases()
            if not test_cases:
                logger.error("No test cases found")
                return 1

        logger.info(f"Found {len(test_cases)} test cases")

        # Override XSD URL if provided
        if args.xsd_url:
            logger.info(f"Overriding XSD URL with: {args.xsd_url}")
            for test_case in test_cases:
                test_case["xsd_url"] = args.xsd_url

        # Initialize test runner
        runner = ValidationTestRunner()

        # Run tests
        summary = runner.run_test_suite(test_cases)

        # Print summary
        runner.print_summary(summary, verbose=args.verbose)

        # Save results if requested
        if args.output:
            runner.save_results(args.output)
            logger.info(f"Results saved to: {args.output}")

        # Return appropriate exit code
        return 0 if summary["failed_tests"] == 0 else 1

    except KeyboardInterrupt:
        logger.info("Validation interrupted by user")
        return 130
    except Exception as e:
        logger.error(f"Validation failed: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
