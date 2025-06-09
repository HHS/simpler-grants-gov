import logging
from typing import Callable

from src.form_schema.rule_processing.json_rule_context import JsonRuleContext
from src.form_schema.rule_processing.json_rule_field_population import (
    POST_POPULATION_MAPPER,
    PRE_POPULATION_MAPPER,
    handle_field_population,
)
from src.form_schema.rule_processing.json_rule_validator import handle_validation

logger = logging.getLogger(__name__)


def handle_pre_population(context: JsonRuleContext, rule: dict, path: list[str]) -> None:
    if context.config.do_pre_population:
        handle_field_population(context, rule, path, PRE_POPULATION_MAPPER)


def handle_post_population(context: JsonRuleContext, rule: dict, path: list[str]) -> None:
    if context.config.do_post_population:
        handle_field_population(context, rule, path, POST_POPULATION_MAPPER)


handlers: dict[str, Callable[[JsonRuleContext, dict, list[str]], None]] = {
    "gg_pre_population": handle_pre_population,
    "gg_post_population": handle_post_population,
    "gg_validation": handle_validation,
}


def process_rule_schema_for_context(context: JsonRuleContext) -> None:
    """Process a rule schema for a given json rule context"""
    # If there is no rule schema configured, return
    rule_schema = context.application_form.form.form_rule_schema
    if rule_schema is None:
        return

    _process_rule_schema(context, rule_schema, [])


def _process_rule_schema(context: JsonRuleContext, rule_schema: dict, path: list[str]) -> None:
    """Recursively process a rule schema."""

    # Iterate over this layer of the rule schema
    for k, v in rule_schema.items():
        # If the key is a known rule, process it
        if k in handlers:
            handlers[k](context, v, path)

        # If the value is a dict, recursively iterate down, extending the path
        elif isinstance(v, dict):
            _process_rule_schema(context=context, rule_schema=v, path=path + [k])

        # Anything else, do nothing
