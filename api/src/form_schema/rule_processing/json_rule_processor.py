from dataclasses import dataclass
from typing import Any, Callable
import logging
from src.db.models.competition_models import ApplicationForm
from src.db.models.opportunity_models import Opportunity
from src.form_schema.rule_processing.json_rule_context import JsonRuleContext
from src.form_schema.rule_processing.json_rule_field_population import PRE_POPULATION_MAPPER, POST_POPULATION_MAPPER, handle_field_population
from src.util.datetime_util import get_now_us_eastern_date

logger = logging.getLogger(__name__)

# TODO - move this somewhere else as its not generic / is reliant on an application?


def handle_pre_population(context: JsonRuleContext, rule: dict, path: list[str]) -> None:
    # TODO - check config
    handle_field_population(context, rule, path, PRE_POPULATION_MAPPER)

def handle_post_population(context: JsonRuleContext, rule: dict, path: list[str]) -> None:
    # TODO - check config
    handle_field_population(context, rule, path, POST_POPULATION_MAPPER)

def handle_validation(context: JsonRuleContext, rule: dict, path: list[str]) -> None:
    pass

handlers = { # TODO - typing
    "gg_pre_population": handle_pre_population,
    "gg_post_population": handle_post_population,
    "gg_validation": handle_validation
}


# TODO - make a wrapper func?
def process_rule_schema(context: JsonRuleContext, rule_schema: dict, path: list[str]):
    print(rule_schema, path)
    print()

    for k, v in rule_schema.items():
        if k in handlers:
            handlers[k](context, v, path)

        elif isinstance(v, dict):
            process_rule_schema(context=context, rule_schema=v, path=path + [k])
