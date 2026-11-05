import logging
from collections.abc import Callable

from src.form_schema.rule_processing.json_rule_context import JsonRule, JsonRuleContext
from src.form_schema.rule_processing.json_rule_field_population import (
    POST_POPULATION_MAPPER,
    PRE_POPULATION_MAPPER,
    handle_field_population,
)
from src.form_schema.rule_processing.json_rule_util import build_path_str
from src.form_schema.rule_processing.json_rule_validator import handle_validation
from src.util.dict_util import get_nested_value

logger = logging.getLogger(__name__)


def handle_pre_population(context: JsonRuleContext, json_rule: JsonRule) -> None:
    if context.config.do_pre_population:
        handle_field_population(context, json_rule, PRE_POPULATION_MAPPER)


def handle_post_population(context: JsonRuleContext, json_rule: JsonRule) -> None:
    if context.config.do_post_population:
        handle_field_population(context, json_rule, POST_POPULATION_MAPPER)


handlers: dict[str, Callable[[JsonRuleContext, JsonRule], None]] = {
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

    # Build the rules
    _build_rules(context, rule_schema, [])
    context.rules.sort(key=lambda r: r.order)

    # Run the rules in order
    for rule in context.rules:
        handlers[rule.handler](context, rule)


def _build_rules(context: JsonRuleContext, rule_schema: dict, path: list[str]) -> None:
    """Recursively iterate over the rule schema definition and construct
    the rules that we want to run.

    If a field is marked as an array field, we'll add a rule for each
    value within the defined value, if the
    """

    # If the field is marked as an array, we'll need to process it a little
    # different because we need to build paths for every possible value.
    if rule_schema.get("gg_type", None) == "array":
        # To know what indexes we need for an array, we have to look at the data
        value = get_nested_value(context.json_data, path)

        # If the value doesn't yet exist, we won't process any rules
        # we only run rules on array fields that exist, we won't create
        # array items, only adjust values in them.
        if value is None:
            return
        # If the value isn't a list, something is misconfigured
        if not isinstance(value, list):
            logger.error(
                "Field marked as array in rule schema has non-array type",
                extra={"field_type": str(type(value)), "path": build_path_str(path)},
            )
            return

        # Make a copy of the rule schema and remove gg_type so when it
        # continues to recurse/iterate, it doesn't keep hitting this case.
        sub_rule_schema = rule_schema.copy()
        sub_rule_schema.pop("gg_type")

        # For each value, we build the rules for that index, if we had an array
        # with 3 values, we would setup 3 paths like "my_field[0]", "my_field[1]", and "my_field[2]"
        for i in range(len(value)):
            subpath = path.copy()
            subpath[-1] = subpath[-1] + f"[{i}]"
            _build_rules(context=context, rule_schema=sub_rule_schema, path=subpath)

        return

    # If not an array field (or already recursively handling array case)
    # Iterate over this layer of the rule schema
    for k, v in rule_schema.items():
        if k in handlers:
            if not isinstance(v, dict):
                logger.error(
                    "Misconfigured rule schema, is not a dict", extra={"path": build_path_str(path)}
                )
                return

            order = v.get(
                "order", 1
            )  # Most rules won't have an order configured, default them to 1
            context.rules.append(JsonRule(handler=k, rule=v, path=path, order=order))

        # If the value is a dict, recursively iterate down, extending the path
        elif isinstance(v, dict):
            _build_rules(context=context, rule_schema=v, path=path + [k])

        # Anything else, do nothing
