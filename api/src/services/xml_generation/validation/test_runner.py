"""Test runner for XML validation against XSD schemas."""

import json
import logging
from pathlib import Path
from typing import Any

import click

from src.form_schema.forms.attachment_form import (
    FORM_XML_TRANSFORM_RULES as ATTACHMENT_FORM_TRANSFORM_RULES,
)
from src.form_schema.forms.epa_form_4700_4 import (
    FORM_XML_TRANSFORM_RULES as EPA4700_4_TRANSFORM_RULES,
)
from src.form_schema.forms.sf424 import FORM_XML_TRANSFORM_RULES as SF424_TRANSFORM_RULES
from src.form_schema.forms.sf424a import FORM_XML_TRANSFORM_RULES as SF424A_TRANSFORM_RULES
from src.form_schema.forms.sflll import FORM_XML_TRANSFORM_RULES as SFLLL_TRANSFORM_RULES
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService

from .xsd_validator import XSDValidator

logger = logging.getLogger(__name__)

# Map form names to their transform rules
FORM_TRANSFORM_RULES = {
    "SF424_4_0": SF424_TRANSFORM_RULES,
    "SF424A": SF424A_TRANSFORM_RULES,
    "EPA4700_4": EPA4700_4_TRANSFORM_RULES,
    "SFLLL_2_0": SFLLL_TRANSFORM_RULES,
    "AttachmentForm_1_2": ATTACHMENT_FORM_TRANSFORM_RULES,
}


class ValidationTestRunner:
    """Runs validation tests for XML generation against XSD schemas.

    **Prerequisites**: XSD files must be pre-downloaded using the fetch-xsds CLI command.
    """

    def __init__(self, xsd_cache_dir: str | Path):
        """Initialize validation test runner.

        Args:
            xsd_cache_dir: Directory containing cached XSD files.
                          XSD files must be pre-downloaded using 'flask task fetch-xsds'.

        Raises:
            XSDValidationError: If cache directory doesn't exist
        """
        self.xml_service = XMLGenerationService()
        self.xsd_validator = XSDValidator(xsd_cache_dir)
        self.results: list[dict[str, Any]] = []

    def run_validation_test(
        self,
        test_name: str,
        json_input: dict[str, Any],
        xsd_url_or_path: str,
        form_name: str = "SF424_4_0",
        pretty_print: bool = True,
    ) -> dict[str, Any]:
        """Run a single validation test.

        Args:
            test_name: Name of the test case
            json_input: JSON input data
            xsd_url_or_path: URL to XSD file (will be converted to cached file path)
            form_name: Form name for XML generation
            pretty_print: Whether to pretty-print XML

        Returns:
            Test result dictionary
        """
        logger.info(f"Running validation test: {test_name}")

        try:
            # Get transform rules for the form
            transform_config = FORM_TRANSFORM_RULES.get(form_name)
            if not transform_config:
                return {
                    "test_name": test_name,
                    "success": False,
                    "error": "configuration_error",
                    "error_message": f"No transform rules found for form: {form_name}",
                    "xml_content": None,
                    "validation_result": None,
                }

            # Generate XML
            request = XMLGenerationRequest(
                transform_config=transform_config,
                application_data=json_input,
                pretty_print=pretty_print,
            )

            response = self.xml_service.generate_xml(request)

            if not response.success:
                return {
                    "test_name": test_name,
                    "success": False,
                    "error": "XML generation failed",
                    "error_message": response.error_message,
                    "xml_content": None,
                    "validation_result": None,
                }

            # Validate against XSD
            if response.xml_data is None:
                return {
                    "test_name": test_name,
                    "success": False,
                    "error": "xml_generation_failed",
                    "error_message": "XML generation returned None",
                    "xml_content": None,
                    "validation_result": None,
                }

            # Convert URL to cached file path
            xsd_file_path = self._get_xsd_file_path(xsd_url_or_path)

            validation_result = self.xsd_validator.validate_xml(response.xml_data, xsd_file_path)

            result = {
                "test_name": test_name,
                "success": validation_result["valid"],
                "error": validation_result["error_type"],
                "error_message": validation_result["error_message"],
                "xml_content": response.xml_data,
                "validation_result": validation_result,
            }

            self.results.append(result)
            return result

        except Exception as e:
            logger.exception(f"Test execution error for {test_name}")
            error_result = {
                "test_name": test_name,
                "success": False,
                "error": "test_execution_error",
                "error_message": str(e),
                "xml_content": None,
                "validation_result": None,
            }
            self.results.append(error_result)
            return error_result

    def _get_xsd_file_path(self, xsd_url: str) -> Path:
        """Convert XSD URL to cached file path."""
        # Extract filename from URL
        xsd_filename = xsd_url.split("/")[-1]
        return self.xsd_validator.xsd_cache_dir / xsd_filename

    def run_test_suite(self, test_cases: list[dict[str, Any]]) -> dict[str, Any]:
        """Run a suite of validation tests."""
        logger.info(f"Running validation test suite with {len(test_cases)} test cases")

        self.results = []

        for test_case in test_cases:
            self.run_validation_test(
                test_name=test_case["name"],
                json_input=test_case["json_input"],
                xsd_url_or_path=test_case["xsd_url"],
                form_name=test_case.get("form_name", "SF424_4_0"),
                pretty_print=test_case.get("pretty_print", True),
            )

        # Calculate summary
        total_tests = len(self.results)
        successful_tests = sum(1 for r in self.results if r["success"])
        failed_tests = total_tests - successful_tests

        # Group failures by error type
        error_summary: dict[str, list[str]] = {}
        for result in self.results:
            if not result["success"]:
                error_type = result["error"]
                if error_type not in error_summary:
                    error_summary[error_type] = []
                error_summary[error_type].append(result["test_name"])

        summary = {
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "failed_tests": failed_tests,
            "success_rate": (successful_tests / total_tests * 100) if total_tests > 0 else 0,
            "error_summary": error_summary,
            "results": self.results,
        }

        logger.info(f"Test suite completed: {successful_tests}/{total_tests} tests passed")
        return summary

    def save_results(self, output_file: str) -> None:
        """Save test results to a JSON file.

        Args:
            output_file: Path to output JSON file
        """
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)

        logger.info(f"Results saved to: {output_path}")

    def print_summary(self, summary: dict[str, Any]) -> None:
        """Print a summary of test results.

        Args:
            summary: Test results summary
        """
        click.echo("\n" + "=" * 60)
        click.echo("XML VALIDATION TEST SUMMARY")
        click.echo("=" * 60)
        click.echo(f"Total Tests: {summary['total_tests']}")
        click.echo(f"Successful: {summary['successful_tests']}")
        click.echo(f"Failed: {summary['failed_tests']}")
        click.echo(f"Success Rate: {summary['success_rate']:.1f}%")

        if summary["error_summary"]:
            click.echo("\nFAILURE BREAKDOWN:")
            for error_type, test_names in summary["error_summary"].items():
                click.echo(f"  {error_type}: {len(test_names)} tests")
                for test_name in test_names:
                    click.echo(f"    - {test_name}")

        click.echo("=" * 60)
