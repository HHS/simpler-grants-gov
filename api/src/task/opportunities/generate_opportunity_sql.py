from src.db.models.opportunity_models import Opportunity
from src.task.task import Task
from sqlalchemy import insert
import src.adapters.db as db
import click
from src.task.ecs_background_task import ecs_background_task

from src.util.env_config import PydanticBaseEnvConfig
from src.task.task_blueprint import task_blueprint
from src.adapters.db import flask_db
import requests

from src.util.local import error_if_not_local

ENV_URL_MAP = {
    "local": "http://localhost:8080/v1/opportunities/{}",
    "dev": "https://api.dev.simpler.grants.gov/v1/opportunities/{}",
    "staging": "https://api.staging.simpler.grants.gov/v1/opportunities/{}",
    "prod": "https://api.simpler.grants.gov/v1/opportunities/{}",
}

@task_blueprint.command("generate-opportunity-sql", help="TODO")
@click.option(
    "--environment", required=True, type=click.Choice(["local", "dev", "staging", "prod"])
)
@click.option("--opportunity-id", required=True, type=str)
@flask_db.with_db_session()
def generate_opportunity_sql():
    # This script is only meant for running locally at this time
    error_if_not_local()

    GenerateOpportunitySqlTask


class GenerateOpportunitySqlTask(Task):

    def __init__(self, db_session: db.Session, opportunity_id: str):
        super().__init__(db_session)

    def run_task(self) -> None:

        insert(Opportunity).values({})


    def fetch_opportunity(self) -> dict:
        requests.get()