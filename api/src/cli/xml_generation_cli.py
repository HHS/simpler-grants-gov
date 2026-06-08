"""Flask CLI commands for XML generation."""

import json
import logging
import sys
from pathlib import Path

import click

from src.form_schema.forms import init_form_registry
from src.services.xml_generation.config import _build_xml_form_map
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.validation.test_cases import (
    get_all_test_cases,
    get_test_cases_by_form,
)
from src.services.xml_generation.validation.test_runner import ValidationTestRunner
from src.services.xml_generation.validation.xsd_fetcher import XSDFetcher
from src.task.task_blueprint import task_blueprint


@task_blueprint.cli.command("generate-xml")
@click.option(
    "--json",
    "json_string",
    help="JSON string input for the application data",
)
@click.option(
    "--file",
    "file_path",
    type=click.Path(exists=True),
    help="Path to JSON file containing application data",
)
@click.option(
    "--form",
    default="SF424_4_0",
)
@click.option(
    "--compact",
    is_flag=True,
    help="Generate compact XML (no pretty printing)",
)
@click.option(
    "--output",
    "output_path",
    type=click.Path(),
    help="Output file path (default: stdout)",
)
def generate_xml_command(
    json_string: str | None,
    file_path: str | None,
    form: str,
    compact: bool,
    output_path: str | None,
) -> None:
    """Generate XML from JSON application data.

    This command is form-agnostic and can generate XML for any configured form.

    Examples:

        # Generate XML from JSON string (SF-424)
        flask task generate-xml --json '{"field": "value"}' --form SF424_4_0

        # Generate SF-424A from file
        flask task generate-xml --file input.json --form SF424A

        # Generate Project Narrative Attachments XML
        flask task generate-xml --file input.json --form ProjectNarrativeAttachments_1_2

        # Generate Budget Narrative Attachments XML
        flask task generate-xml --file input.json --form BudgetNarrativeAttachments_1_2
        # Generate SF-LLL from file
        flask task generate-xml --file sflll.json --form SFLLL_2_0

        # Generate compact XML and save to file
        flask task generate-xml --json '{"field": "value"}' --compact --output out.xml
    """
    try:
        init_form_registry()

        # Normalize
        form_key = form.upper()

        # -----------------------------
        # Validate + lookup transform config
        # -----------------------------
        form_transform_rules_map = _build_xml_form_map()

        transform_config = form_transform_rules_map.get(form_key)

        if transform_config is None:
            valid_forms = ", ".join(sorted(form_transform_rules_map.keys()))
            click.echo(
                f"Error: Invalid form '{form}'. " f"Valid options are: {valid_forms}",
                err=True,
            )
            sys.exit(1)

        # Read JSON input
        if json_string:
            application_data = json.loads(json_string)
        elif file_path:
            with open(file_path) as f:
                application_data = json.load(f)
        else:
            click.echo("Error: Must provide either --json or --file", err=True)
            sys.exit(1)

        # Get transform config for the specified form (validated by click.Choice)
        transform_config = form_transform_rules_map.get(form.upper())

        # Create service and generate XML
        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            transform_config=transform_config,
            pretty_print=not compact,
        )

        response = service.generate_xml(request)

        if not response.success:
            click.echo(f"Error generating XML: {response.error_message}", err=True)
            sys.exit(1)

        # Output XML
        if output_path:
            Path(output_path).write_text(response.xml_data or "")
            click.echo(f"XML written to: {output_path}", err=True)
        else:
            click.echo(response.xml_data or "")

    except json.JSONDecodeError as e:
        click.echo(f"JSON parsing error: {e}", err=True)
        sys.exit(1)
    except FileNotFoundError as e:
        click.echo(f"File not found: {e}", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@task_blueprint.cli.command("validate-xml-generation")
@click.option(
    "--form",
    help="Form name to test (e.g., SF424_4_0). If not specified, runs all forms.",
)
@click.option(
    "--xsd-dir",
    type=click.Path(),
    help="Directory containing XSD files (default: ../services/xml_generation/xsds). Run 'flask task fetch-xsds' first.",
)
@click.option(
    "--output",
    "output_file",
    type=click.Path(),
    help="Output file to save results (JSON format). Defaults to {xsd_dir}/validation_results.json",
)
@click.option(
    "--verbose",
    "-v",
    is_flag=True,
    help="Enable verbose logging",
)
def validate_xml_generation_command(
    form: str | None,
    xsd_dir: str | None,
    output_file: str | None,
    verbose: bool,
) -> None:
    """Run XML validation tests against XSD schemas.

    **Prerequisites**: Run 'flask task fetch-xsds' first to download XSD files.

    This validates that generated XML conforms to Grants.gov XSD schemas.
    Flask handles DB/logging setup automatically.

    By default, results are saved to validation_results.json in the XSD directory.

    Examples:

        # Run all validation tests (results saved to ../services/xml_generation/xsds/validation_results.json)
        flask task validate-xml-generation

        # Run only SF-424 tests
        flask task validate-xml-generation --form SF424_4_0

        # Save results to custom file
        flask task validate-xml-generation --output validation_results.json

        # Use XSD directory
        flask task validate-xml-generation --xsd-dir ../services/xml_generation/xsds
    """
    init_form_registry()

    # Set up logging level
    logger = logging.getLogger(__name__)

    if verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    try:
        # Use default XSD directory if not specified
        if not xsd_dir:
            xsd_dir = str(Path(__file__).resolve().parents[2] / "src/services/xml_generation/xsds")

        # Verify XSD directory exists
        xsd_path = Path(xsd_dir)
        if not xsd_path.exists():
            click.echo(
                f"Error: XSD directory not found: {xsd_dir}\n"
                "Run 'flask task fetch-xsds' first to download XSD files.",
                err=True,
            )
            sys.exit(1)

        # Default output file to xsd directory if not specified
        if not output_file:
            output_file = str(xsd_path / "validation_results.json")

        # Get test cases
        if form:
            test_cases = get_test_cases_by_form(form)
            if not test_cases:
                click.echo(f"Error: No test cases found for form: {form}", err=True)
                sys.exit(1)
        else:
            test_cases = get_all_test_cases()
            if not test_cases:
                click.echo("Error: No test cases found", err=True)
                sys.exit(1)

        # APPLY SKIP FILTER
        test_cases, skipped = filter_skipped(test_cases)
        if skipped:
            click.echo("Skipped tests (Fix existing skipped XSD validation tests #10424):")
            for name in skipped:
                click.echo(f"  - {name}")
            click.echo("")

        click.echo(f"Found {len(test_cases)} test cases")
        click.echo(f"XSD directory: {xsd_dir}")
        click.echo(f"Results will be saved to: {output_file}")
        click.echo("")

        # Initialize test runner with xsd directory
        xml_form_map = _build_xml_form_map()

        runner = ValidationTestRunner(xsd_dir=xsd_dir, xml_form_map=xml_form_map)

        # Run tests
        summary = runner.run_test_suite(test_cases)

        # Print summary
        runner.print_summary(summary)

        # Save results (now always saves, since we have a default)
        runner.save_results(output_file)
        click.echo(f"\nResults saved to: {output_file}")

        # Exit with appropriate code
        sys.exit(0 if summary["failed_tests"] == 0 else 1)

    except KeyboardInterrupt:
        click.echo("\nValidation interrupted by user", err=True)
        sys.exit(130)
    except Exception as e:
        logger.error(f"Validation failed: {e}", exc_info=verbose)
        click.echo(f"Error: Validation failed: {e}", err=True)
        sys.exit(1)


@task_blueprint.cli.command("fetch-xsds")
@click.option(
    "--xsd-dir",
    type=click.Path(),
    help="Directory to store XSD files (default: ../services/xml_generation/xsds)",
)
@click.option(
    "--form",
    help="Form name to fetch XSD for (e.g., SF424_4_0). If not specified, fetches all forms.",
)
@click.option(
    "--verbose",
    "-v",
    is_flag=True,
    help="Enable verbose logging",
)
def fetch_xsds_command(
    xsd_dir: str | None,
    form: str | None,
    verbose: bool,
) -> None:
    """Pre-fetch and store XSD files for offline validation.

    This command downloads XSD schema files and stores them in a local
    XSD directory. Run this before using the validate-xml-generation command.

    Examples:
        # Fetch all XSD files (uses ../services/xml_generation/xsds by default)
        flask task fetch-xsds

        # Fetch XSDs to a specific XSD directory
        flask task fetch-xsds --xsd-dir ../services/xml_generation/xsds

        # Fetch XSD for a specific form
        flask task fetch-xsds --form SF424_4_0
    """
    logger = logging.getLogger(__name__)

    if verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    try:
        # Use default XSD directory if not specified
        if not xsd_dir:
            xsd_dir = str(Path(__file__).resolve().parents[2] / "src/services/xml_generation/xsds")

        # Get test cases to determine which XSDs we need
        if form:
            test_cases = get_test_cases_by_form(form)
            if not test_cases:
                click.echo(f"Error: No test cases found for form: {form}", err=True)
                sys.exit(1)
            click.echo(f"Fetching XSD for form: {form}")
        else:
            test_cases = get_all_test_cases()
            if not test_cases:
                click.echo("Error: No test cases found", err=True)
                sys.exit(1)
            click.echo(f"Fetching XSDs for {len(test_cases)} test cases")

        # Initialize fetcher with XSD directory
        fetcher = XSDFetcher(xsd_dir=xsd_dir)
        click.echo(f"XSD Directory: {fetcher.xsd_dir}")
        click.echo("")

        # Track unique XSD URLs to avoid duplicate downloads
        xsd_urls = set()
        for test_case in test_cases:
            xsd_url = test_case.get("xsd_url")
            if xsd_url and xsd_url not in xsd_urls:
                xsd_urls.add(xsd_url)

        if not xsd_urls:
            click.echo("Warning: No XSD URLs found in test cases", err=True)
            sys.exit(0)

        click.echo(f"Found {len(xsd_urls)} unique XSD files to fetch")
        click.echo("")

        # Fetch each XSD with dependencies
        all_fetched = []
        all_stored = []
        all_errors = []

        for i, xsd_url in enumerate(sorted(xsd_urls), 1):
            click.echo(f"[{i}/{len(xsd_urls)}] Processing: {xsd_url}")
            click.echo("  Fetching XSD and all dependencies...")

            try:
                # Recursively fetch XSD and all its dependencies
                result = fetcher.fetch_xsd_with_dependencies(xsd_url)

                # Track statistics
                fetched = result.get("fetched", [])
                stored = result.get("stored", [])
                errors = result.get("errors", [])

                all_fetched.extend(fetched)
                all_stored.extend(stored)
                all_errors.extend(errors)

                if fetched:
                    click.echo(f"Downloaded {len(fetched)} file(s)")
                    if verbose:
                        for url in fetched:
                            click.echo(f"    - {url}")

                if stored:
                    click.echo(f"Found {len(stored)} file(s) in XSD dir")
                    if verbose:
                        for url in stored:
                            click.echo(f"    - {url}")

                if errors:
                    click.echo(f"{len(errors)} error(s) encountered", err=True)
                    for error in errors:
                        click.echo(f"    - {error['url']}: {error['error']}", err=True)

            except Exception as e:
                click.echo(f"  ✗ Error: {e}", err=True)
                all_errors.append({"url": xsd_url, "error": str(e)})
                if verbose:
                    logger.error(f"Failed to fetch {xsd_url}", exc_info=True)

            click.echo("")

        # Remove duplicates for counting
        unique_fetched = list(set(all_fetched))
        unique_stored = list(set(all_stored))

        # Print summary
        click.echo("=" * 70)
        click.echo("Fetch Summary")
        click.echo("=" * 70)
        click.echo(f"Main XSD files:          {len(xsd_urls)}")
        click.echo(f"Total files downloaded:  {len(unique_fetched)}")
        click.echo(f"Total files stored:      {len(unique_stored)}")
        click.echo(f"Total files processed:   {len(unique_fetched) + len(unique_stored)}")
        if all_errors:
            click.echo(f"Errors encountered:      {len(all_errors)}")
        click.echo("")
        click.echo(f"XSD directory: {fetcher.xsd_dir}")

        if all_errors:
            click.echo("")
            click.echo("Some XSD files failed to download", err=True)
            sys.exit(1)
        else:
            click.echo("")
            click.echo("All XSD files successfully stored!")
            sys.exit(0)

    except KeyboardInterrupt:
        click.echo("\nFetch interrupted by user", err=True)
        sys.exit(130)
    except Exception as e:
        logger.error(f"Fetch failed: {e}", exc_info=verbose)
        click.echo(f"Error: Fetch failed: {e}", err=True)
        sys.exit(1)


def filter_skipped(test_cases: list) -> tuple[list, list]:
    SKIPPED = {
        "sf424_with_single_attachment",
        "sf424_with_multiple_attachments",
        "sf424_with_all_attachment_types",
        "sf424a_minimal_non_federal_resources_only",
        "sf424a_budget_sections_with_array_decomposition",
        "sf424a_with_forecasted_cash_needs",
        "sf424a_complete_all_sections",
    }

    return (
        [tc for tc in test_cases if tc["name"] not in SKIPPED],
        [tc["name"] for tc in test_cases if tc["name"] in SKIPPED],
    )
