from src.form_schema.rule_processing.json_rule_context import JsonRuleConfig
from src.form_schema.rule_processing.json_rule_processor import JsonRuleContext
from tests.lib.data_factories import setup_application_for_form_validation


def setup_context(
    json_data: dict,
    rule_schema: dict | None,
    # Configurational params
    do_pre_population: bool = True,
    do_post_population: bool = True,
    do_field_validation: bool = True,
    **kwargs: dict
):
    application_form = setup_application_for_form_validation(
        json_data=json_data, json_schema={}, rule_schema=rule_schema, **kwargs
    )

    return JsonRuleContext(
        application_form,
        JsonRuleConfig(
            do_pre_population=do_pre_population,
            do_post_population=do_post_population,
            do_field_validation=do_field_validation,
        ),
    )
