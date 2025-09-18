"""Test runner for XML validation against XSD schemas."""

import json
import logging
from pathlib import Path
from typing import Any

from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService

from .xsd_validator import XSDValidator

logger = logging.getLogger(__name__)


class ValidationTestRunner:
    """Runs validation tests for XML generation against XSD schemas."""

    def __init__(self, cache_dir: str | None = None):
        """Initialize validation test runner.

        Args:
            cache_dir: Directory to cache XSD files
        """
        self.xml_service = XMLGenerationService()
        self.xsd_validator = XSDValidator(cache_dir)
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
            xsd_url_or_path: URL to XSD file or local file path
            form_name: Form name for XML generation
            pretty_print: Whether to pretty-print XML

        Returns:
            Test result dictionary
        """
        logger.info(f"Running validation test: {test_name}")

        try:
            # Generate XML
            request = XMLGenerationRequest(
                form_name=form_name,
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

            validation_result = self.xsd_validator.validate_xml(response.xml_data, xsd_url_or_path)

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

    def run_test_suite(self, test_cases: list[dict[str, Any]]) -> dict[str, Any]:
        """Run a suite of validation tests.

        Args:
            test_cases: List of test case dictionaries with keys:
                - name: Test case name
                - json_input: JSON input data
                - xsd_url: URL to XSD file or local file path
                - form_name: Form name (optional, defaults to SF424_4_0)
                - pretty_print: Whether to pretty-print (optional, defaults to True)

        Returns:
            Summary of test results
        """
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

    def print_summary(self, summary: dict[str, Any], verbose: bool = False) -> None:
        """Print a summary of test results.

        Args:
            summary: Test results summary
            verbose: Show detailed error messages
        """
        print("\n" + "=" * 60)
        print("XML VALIDATION TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {summary['total_tests']}")
        print(f"Successful: {summary['successful_tests']}")
        print(f"Failed: {summary['failed_tests']}")
        print(f"Success Rate: {summary['success_rate']:.1f}%")

        if summary["error_summary"]:
            print("\nFAILURE BREAKDOWN:")
            for error_type, test_names in summary["error_summary"].items():
                print(f"  {error_type}: {len(test_names)} tests")
                for test_name in test_names:
                    print(f"    - {test_name}")

        # Show detailed errors for failed tests
        if verbose and summary["failed_tests"] > 0:
            print("\nDETAILED VALIDATION ERRORS:")
            print("=" * 60)
            for result in summary["results"]:
                if not result["success"]:
                    print(f"\n{result['test_name']}:")
                    if result.get("validation_result"):
                        validation_result = result["validation_result"]
                        if hasattr(validation_result, "errors") and validation_result.errors:
                            for i, error in enumerate(
                                validation_result.errors[:3]
                            ):  # Show first 3 errors
                                print(f"  {i + 1}. {error}")
                        elif isinstance(validation_result, dict) and "errors" in validation_result:
                            for i, error in enumerate(
                                validation_result["errors"][:3]
                            ):  # Show first 3 errors
                                print(f"  {i + 1}. {error}")
                    if result.get("error_message"):
                        print(f"  Error: {result['error_message']}")

        print("=" * 60)
