"""Flask CLI commands for XML generation."""

import json
import logging
import sys
from pathlib import Path

import click

from src.form_schema.forms.sf424 import FORM_XML_TRANSFORM_RULES as SF424_TRANSFORM_RULES
from src.form_schema.forms.sf424a import FORM_XML_TRANSFORM_RULES as SF424A_TRANSFORM_RULES
from src.form_schema.forms.sflll import FORM_XML_TRANSFORM_RULES as SFLLL_TRANSFORM_RULES
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.validation.test_cases import (
    get_all_test_cases,
    get_test_cases_by_form,
)
from src.services.xml_generation.validation.test_runner import ValidationTestRunner
from src.services.xml_generation.validation.xsd_fetcher import XSDFetcher
from src.task.task_blueprint import task_blueprint

# Map form names to their transform rules
FORM_TRANSFORM_RULES_MAP = {
    "SF424_4_0": SF424_TRANSFORM_RULES,
    "SF424A": SF424A_TRANSFORM_RULES,
    "SFLLL_2_0": SFLLL_TRANSFORM_RULES,
}


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
    help="Form name/version (e.g., SF424_4_0, SF424A, SFLLL_2_0). Default: SF424_4_0",
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

        # Generate SF-LLL from file
        flask task generate-xml --file sflll.json --form SFLLL_2_0

        # Generate compact XML and save to file
        flask task generate-xml --json '{"field": "value"}' --compact --output out.xml
    """
    try:
        # Read JSON input
        if json_string:
            application_data = json.loads(json_string)
        elif file_path:
            with open(file_path) as f:
                application_data = json.load(f)
        else:
            click.echo("Error: Must provide either --json or --file", err=True)
            sys.exit(1)

        # Get transform config for the specified form
        transform_config = FORM_TRANSFORM_RULES_MAP.get(form)
        if not transform_config:
            click.echo(
                f"Error: Unknown form '{form}'. Available forms: {', '.join(FORM_TRANSFORM_RULES_MAP.keys())}",
                err=True,
            )
            sys.exit(1)

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
    "--cache-dir",
    type=click.Path(),
    help="Directory containing cached XSD files (default: ./xsd_cache). Run 'flask task fetch-xsds' first.",
)
@click.option(
    "--output",
    "output_file",
    type=click.Path(),
    help="Output file to save results (JSON format). Defaults to {cache_dir}/validation_results.json",
)
@click.option(
    "--verbose",
    "-v",
    is_flag=True,
    help="Enable verbose logging",
)
def validate_xml_generation_command(
    form: str | None,
    cache_dir: str | None,
    output_file: str | None,
    verbose: bool,
) -> None:
    """Run XML validation tests against XSD schemas.

    **Prerequisites**: Run 'flask task fetch-xsds' first to download XSD files.

    This validates that generated XML conforms to Grants.gov XSD schemas.
    Flask handles DB/logging setup automatically.

    By default, results are saved to validation_results.json in the XSD cache directory.

    Examples:

        # Run all validation tests (results saved to ./xsd_cache/validation_results.json)
        flask task validate-xml-generation

        # Run only SF-424 tests
        flask task validate-xml-generation --form SF424_4_0

        # Save results to custom file
        flask task validate-xml-generation --output validation_results.json

        # Use custom cache directory
        flask task validate-xml-generation --cache-dir /tmp/xsd_cache
    """
    # Set up logging level
    logger = logging.getLogger(__name__)
    if verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    try:
        # Use default cache directory if not specified
        if not cache_dir:
            cache_dir = "./xsd_cache"

        # Verify cache directory exists
        cache_path = Path(cache_dir)
        if not cache_path.exists():
            click.echo(
                f"Error: XSD cache directory not found: {cache_dir}\n"
                "Run 'flask task fetch-xsds' first to download XSD files.",
                err=True,
            )
            sys.exit(1)

        # Default output file to cache directory if not specified
        if not output_file:
            output_file = str(cache_path / "validation_results.json")

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

        click.echo(f"Found {len(test_cases)} test cases")
        click.echo(f"XSD cache directory: {cache_dir}")
        click.echo(f"Results will be saved to: {output_file}")
        click.echo("")

        # Initialize test runner with cache directory
        runner = ValidationTestRunner(xsd_cache_dir=cache_dir)

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
    "--cache-dir",
    type=click.Path(),
    help="Directory to cache XSD files (default: ./xsd_cache)",
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
    cache_dir: str | None,
    form: str | None,
    verbose: bool,
) -> None:
    """Pre-fetch and cache XSD files for offline validation.

    This command downloads XSD schema files and stores them in a local cache
    directory. Run this before using the validate-xml-generation command.

    Examples:
        # Fetch all XSD files (uses ./xsd_cache by default)
        flask task fetch-xsds

        # Fetch XSDs to a specific cache directory
        flask task fetch-xsds --cache-dir /tmp/xsd_cache

        # Fetch XSD for a specific form
        flask task fetch-xsds --form SF424_4_0
    """
    logger = logging.getLogger(__name__)

    if verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    try:
        # Use default cache directory if not specified
        if not cache_dir:
            cache_dir = "./xsd_cache"

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

        # Initialize fetcher with cache directory
        fetcher = XSDFetcher(cache_dir=cache_dir)
        click.echo(f"Cache directory: {fetcher.cache_dir}")
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
        all_cached = []
        all_errors = []

        for i, xsd_url in enumerate(sorted(xsd_urls), 1):
            click.echo(f"[{i}/{len(xsd_urls)}] Processing: {xsd_url}")
            click.echo("  Fetching XSD and all dependencies...")

            try:
                # Recursively fetch XSD and all its dependencies
                result = fetcher.fetch_xsd_with_dependencies(xsd_url)

                # Track statistics
                fetched = result.get("fetched", [])
                cached = result.get("cached", [])
                errors = result.get("errors", [])

                all_fetched.extend(fetched)
                all_cached.extend(cached)
                all_errors.extend(errors)

                if fetched:
                    click.echo(f"Downloaded {len(fetched)} file(s)")
                    if verbose:
                        for url in fetched:
                            click.echo(f"    - {url}")

                if cached:
                    click.echo(f"Found {len(cached)} file(s) in cache")
                    if verbose:
                        for url in cached:
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
        unique_cached = list(set(all_cached))

        # Print summary
        click.echo("=" * 70)
        click.echo("Fetch Summary")
        click.echo("=" * 70)
        click.echo(f"Main XSD files:          {len(xsd_urls)}")
        click.echo(f"Total files downloaded:  {len(unique_fetched)}")
        click.echo(f"Total files cached:      {len(unique_cached)}")
        click.echo(f"Total files processed:   {len(unique_fetched) + len(unique_cached)}")
        if all_errors:
            click.echo(f"Errors encountered:      {len(all_errors)}")
        click.echo("")
        click.echo(f"Cache location: {fetcher.cache_dir}")

        if all_errors:
            click.echo("")
            click.echo("Some XSD files failed to download", err=True)
            sys.exit(1)
        else:
            click.echo("")
            click.echo("All XSD files successfully cached!")
            sys.exit(0)

    except KeyboardInterrupt:
        click.echo("\nFetch interrupted by user", err=True)
        sys.exit(130)
    except Exception as e:
        logger.error(f"Fetch failed: {e}", exc_info=verbose)
        click.echo(f"Error: Fetch failed: {e}", err=True)
        sys.exit(1)
