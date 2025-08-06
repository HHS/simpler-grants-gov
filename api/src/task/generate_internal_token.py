"""
This CLI command creates an internal JWT token that can be used to authenticate
with endpoints that accept internal authentication (e.g., for PDF generation).

Usage:
    flask task generate-internal-token [--expiration-minutes MINUTES] [--quiet]

The token will be printed to stdout and can be used with the X-SGG-Internal-Token header.

Example:
    make cmd args="task generate-internal-token"
    make cmd args="task generate-internal-token --expiration-minutes 60"
    make cmd args="task generate-internal-token --quiet"
"""

import logging
from datetime import timedelta

import click

import src.adapters.db as db
import src.util.datetime_util as datetime_util
from src.adapters.db import flask_db
from src.auth.api_jwt_auth import initialize_jwt_auth
from src.auth.internal_jwt_auth import create_jwt_for_internal_token
from src.task.task_blueprint import task_blueprint
from src.util.local import error_if_not_local

logger = logging.getLogger(__name__)

DEFAULT_EXPIRATION_MINUTES = 30


@task_blueprint.cli.command(
    "generate-internal-token", help="Generate an internal JWT token for testing purposes"
)
@click.option(
    "--expiration-minutes",
    type=int,
    default=DEFAULT_EXPIRATION_MINUTES,
    help=f"Number of minutes until the token expires (default: {DEFAULT_EXPIRATION_MINUTES})",
)
@click.option("--quiet", is_flag=True, help="Only output the token, no additional messages")
@flask_db.with_db_session()
def generate_internal_token_cli(
    db_session: db.Session, expiration_minutes: int, quiet: bool
) -> None:
    """Generate an internal JWT token for testing purposes."""
    # Ensure we're running in a local environment
    error_if_not_local()

    # Initialize JWT auth configuration (should already be done by Flask app)
    initialize_jwt_auth()

    # Calculate expiration time
    current_time = datetime_util.utcnow()
    expires_at = current_time + timedelta(minutes=expiration_minutes)

    # Generate the token
    with db_session.begin():
        jwt_token, short_lived_token = create_jwt_for_internal_token(
            expires_at=expires_at, db_session=db_session
        )

        logger.info(
            "Generated internal JWT token",
            extra={
                "short_lived_internal_token_id": str(
                    short_lived_token.short_lived_internal_token_id
                ),
                "expires_at": expires_at.isoformat(),
                "expiration_minutes": expiration_minutes,
            },
        )

    if quiet:
        # Only print the token for easy copy/paste
        click.echo(jwt_token)
    else:
        # Print with helpful information
        click.echo("=" * 80)
        click.echo("INTERNAL JWT TOKEN GENERATED")
        click.echo("=" * 80)
        click.echo(f"Expiration: {expiration_minutes} minutes")
        click.echo("Header: X-SGG-Internal-Token")
        click.echo("-" * 80)
        click.echo("Token:")
        click.echo(jwt_token)
        click.echo("-" * 80)
        click.echo("Example usage:")
        click.echo(
            f'curl -H "X-SGG-Internal-Token: {jwt_token}" http://localhost:5000/alpha/applications/<application_id>/application_form/<form_id>'
        )
        click.echo("=" * 80)
