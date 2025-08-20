"""CLI commands for testing PDF generation functionality."""

import logging
import uuid

import click

import src.adapters.db as db
from src.adapters.db import flask_db
from src.services.pdf_generation.service import generate_application_form_pdf
from src.task.task_blueprint import task_blueprint

logger = logging.getLogger(__name__)


@task_blueprint.cli.command("test-pdf-generation", help="Test PDF generation with mock data")
@click.option(
    "--application-id",
    type=str,
    required=True,
    help="Application ID to use for testing",
)
@click.option(
    "--application-form-id",
    type=str,
    required=True,
    help="Application form ID to use for testing",
)
@click.option(
    "--use-mocks",
    is_flag=True,
    default=False,
    help="Use mock clients instead of real services",
)
@click.option(
    "--output-file",
    type=str,
    help="Optional file path to save the generated PDF",
)
@flask_db.with_db_session()
def test_pdf_generation_cli(
    db_session: db.Session,
    application_id: str,
    application_form_id: str,
    use_mocks: bool,
    output_file: str | None,
) -> None:
    """Test PDF generation functionality."""
    try:
        # Parse the UUIDs
        app_id = uuid.UUID(application_id)
        form_id = uuid.UUID(application_form_id)

        logger.info(
            "Testing PDF generation",
            extra={
                "application_id": application_id,
                "application_form_id": application_form_id,
                "use_mocks": use_mocks,
                "output_file": output_file,
            },
        )

        # Generate the PDF
        response = generate_application_form_pdf(
            db_session=db_session,
            application_id=app_id,
            application_form_id=form_id,
            use_mocks=use_mocks,
        )

        if response.success:
            logger.info(
                "PDF generation successful",
                extra={"pdf_size_bytes": len(response.pdf_data)},
            )

            # Save to file if requested
            if output_file:
                with open(output_file, "wb") as f:
                    f.write(response.pdf_data)
                logger.info(f"PDF saved to {output_file}")
                click.echo(f"✅ PDF successfully saved to {output_file}")
            else:
                click.echo(f"✅ PDF generated successfully ({len(response.pdf_data)} bytes)")

        else:
            logger.error(
                "PDF generation failed",
                extra={"error": response.error_message},
            )
            click.echo(f"❌ PDF generation failed: {response.error_message}")

    except ValueError as e:
        logger.error(f"Invalid UUID format: {e}")
        click.echo(f"❌ Invalid UUID format: {e}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        click.echo(f"❌ Unexpected error: {e}")


@task_blueprint.cli.command("test-docraptor-dummy", help="Test DocRaptor with dummy data")
@click.option(
    "--output-file",
    type=str,
    default="test_output.pdf",
    help="File path to save the generated PDF",
)
@flask_db.with_db_session()
def test_docraptor_dummy_cli(
    db_session: db.Session,
    output_file: str,
) -> None:
    """Test DocRaptor with dummy HTML content."""
    from src.services.pdf_generation.clients import DocRaptorClient
    from src.services.pdf_generation.config import get_config

    try:
        logger.info("Testing DocRaptor with dummy HTML content")

        # Simple HTML content for testing
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test PDF Generation</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                h1 {{ color: #333; }}
                .form-section {{ margin: 20px 0; padding: 15px; border: 1px solid #ddd; }}
            </style>
        </head>
        <body>
            <h1>Test Application Form</h1>
            <div class="form-section">
                <h2>Application Information</h2>
                <p><strong>Application ID:</strong> test-123-456</p>
                <p><strong>Form ID:</strong> form-789-012</p>
                <p><strong>Generated:</strong> {timestamp}</p>
            </div>
            <div class="form-section">
                <h2>Test Content</h2>
                <p>This is a test PDF generated using DocRaptor API.</p>
                <p>If you can see this content in a PDF file, then the integration is working correctly.</p>
            </div>
        </body>
        </html>
        """.format(
            timestamp="2024-01-01 12:00:00 UTC"
        )

        # Use the DocRaptor client
        config = get_config()
        client = DocRaptorClient(config)

        # Generate PDF
        pdf_data = client.html_to_pdf(html_content)

        # Save to file
        with open(output_file, "wb") as f:
            f.write(pdf_data)

        logger.info(
            "DocRaptor test successful",
            extra={
                "pdf_size_bytes": len(pdf_data),
                "output_file": output_file,
            },
        )
        click.echo(
            f"✅ DocRaptor test successful! PDF saved to {output_file} ({len(pdf_data)} bytes)"
        )

    except Exception as e:
        logger.error(f"DocRaptor test failed: {e}", exc_info=True)
        click.echo(f"❌ DocRaptor test failed: {e}")
