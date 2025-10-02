"""CLI command for generating application XML components (header, footer, etc.)."""

import logging
import uuid

import click

import src.adapters.db as db
from src.adapters.db import flask_db
from src.services.applications.get_application import get_application
from src.services.xml_generation.header_generator import generate_application_header_xml
from src.task.task_blueprint import task_blueprint
from src.util.local import error_if_not_local

logger = logging.getLogger(__name__)


@task_blueprint.cli.command(
    "generate-submission-xml",
    help="Generate submission XML components (header, footer, etc.) for a grant application",
)
@click.option(
    "--application-id",
    required=True,
    help="UUID of the application to generate XML for",
)
@click.option(
    "--part",
    type=click.Choice(["header", "footer", "both"], case_sensitive=False),
    default="header",
    help="Which part of the XML to generate (default: header)",
)
@click.option(
    "--pretty/--no-pretty",
    default=True,
    help="Pretty print the XML output (default: True)",
)
@click.option(
    "--output-file",
    help="Optional file path to write the XML to (prints to stdout if not specified)",
)
@flask_db.with_db_session()
def generate_xml(
    db_session: db.Session,
    application_id: str,
    part: str,
    pretty: bool,
    output_file: str | None,
) -> None:
    # This command is primarily for development/testing purposes
    error_if_not_local()

    try:
        # Parse and validate the UUID
        try:
            app_uuid = uuid.UUID(application_id)
        except ValueError:
            click.echo(f"Error: Invalid application ID format: {application_id}", err=True)
            click.echo("Application ID must be a valid UUID", err=True)
            return

        # Fetch the application with all required relationships
        application = get_application(
            db_session=db_session,
            application_id=app_uuid,
            user=None,  # Internal use, no user validation needed
            is_internal_user=True,
        )

        # Generate the requested XML part(s)
        part_lower = part.lower()
        xml_output = None

        if part_lower == "header":
            xml_output = generate_application_header_xml(application, pretty_print=pretty)
        elif part_lower == "footer":
            # TODO: Implement footer generation
            click.echo("Footer generation is not yet implemented", err=True)
            return
        elif part_lower == "both":
            click.echo("Generating header and footer XML...")
            # TODO: Implement combined generation
            click.echo("Combined header/footer generation is not yet implemented", err=True)
            return

        if xml_output is None:
            click.echo(f"Error: Unknown part '{part}'", err=True)
            return

        # Output the XML
        if output_file:
            # Write to file
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(xml_output)
            logger.info(
                f"Generated {part} XML to file",
                extra={
                    "application_id": application_id,
                    "part": part,
                    "output_file": output_file,
                },
            )
        else:
            # Print to stdout
            click.echo(xml_output)
            logger.info(
                f"Generated {part} XML to stdout",
                extra={"application_id": application_id, "part": part},
            )

    except Exception as e:
        click.echo(f"Error generating {part} XML: {str(e)}", err=True)
        logger.exception(
            f"Failed to generate {part} XML", extra={"application_id": application_id, "part": part}
        )
        raise
