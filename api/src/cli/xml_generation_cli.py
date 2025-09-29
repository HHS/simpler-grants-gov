"""Flask CLI commands for XML generation."""

import json
import sys
from pathlib import Path

import click

from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
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
    help="Form name/version (e.g., SF424_4_0). Default: SF424_4_0",
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

        # Generate XML from JSON string
        flask task generate-xml --json '{"field": "value"}' --form SF424_4_0

        # Generate from file
        flask task generate-xml --file input.json --form SF424_4_0

        # Generate compact XML and save to file
        flask task generate-xml --json '{"field": "value"}' --compact --output out.xml
    """
    try:
        # Read JSON input
        if json_string:
            application_data = json.loads(json_string)
        elif file_path:
            with open(file_path, "r") as f:
                application_data = json.load(f)
        else:
            click.echo("Error: Must provide either --json or --file", err=True)
            sys.exit(1)

        # Create service and generate XML
        service = XMLGenerationService()
        request = XMLGenerationRequest(
            application_data=application_data,
            form_name=form,
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
def validate_xml_generation_command() -> None:
    """Run XML generation validation tests.

    This runs the validation tool that tests JSON to XML conversion
    with static test cases.
    """
    click.echo("Running XML generation validation tests...")
    click.echo("Not yet implemented - use tool/xml_validator.py directly")
    click.echo("  python tool/xml_validator.py")
