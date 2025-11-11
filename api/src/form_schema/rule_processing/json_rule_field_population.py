import logging
from collections.abc import Callable
from decimal import Decimal, InvalidOperation
from typing import Any

from src.form_schema.rule_processing.json_rule_context import JsonRule, JsonRuleContext
from src.form_schema.rule_processing.json_rule_util import get_field_values, populate_nested_value
from src.util.datetime_util import get_now_us_eastern_date

logger = logging.getLogger(__name__)

INDIVIDUAL_UEI = "00000000INDV"
ZERO_DECIMAL = Decimal("0.00")  # For formatting and defining 0 for decimal/monetary
EXCLUDE_VALUE = "exclude_value"
UNKNOWN_VALUE = "unknown"


def get_opportunity_number(context: JsonRuleContext, json_rule: JsonRule) -> str:
    """Get the opportunity number"""
    opportunity_number = context.opportunity.opportunity_number
    if opportunity_number is None:
        # The data model lets opportunity number be null, but in prod
        # there are no null opportunity numbers, this is just a safety net
        # so we always populate something
        logger.error(
            "Opportunity with null opportunity_number run through pre-population",
            extra=context.get_log_context(),
        )
        return UNKNOWN_VALUE

    return opportunity_number


def get_opportunity_title(context: JsonRuleContext, json_rule: JsonRule) -> str:
    """Get the opportunity title"""
    opportunity_title = context.opportunity.opportunity_title
    if opportunity_title is None:
        # The data model lets opportunity title be null, but in prod
        # there are no null opportunity titles, this is just a safety net
        # so we always populate something
        logger.error(
            "Opportunity with null opportunity_title run through pre-population",
            extra=context.get_log_context(),
        )
        return UNKNOWN_VALUE

    return opportunity_title


def get_agency_name(context: JsonRuleContext, json_rule: JsonRule) -> str:
    """Get the agency's name, falling back to agency code if no agency name"""
    if context.opportunity.agency_name is not None:
        return context.opportunity.agency_name

    if context.opportunity.agency_code is not None:
        return context.opportunity.agency_code

    # There are a handful of very old opportunities in prod without an agency
    # attached to them, so this is technically possible, but we shouldn't expect
    # it on anything new with an active competition
    logger.error(
        "Opportunity with null agency_code run through pre-population",
        extra=context.get_log_context(),
    )
    return UNKNOWN_VALUE


def get_current_date(context: JsonRuleContext, json_rule: JsonRule) -> str:
    """Get the current date"""
    return get_now_us_eastern_date().isoformat()


def get_uei(context: JsonRuleContext, json_rule: JsonRule) -> str:
    """Get a UEI from an application's organization

    If the application does not have an organization,
    defaults to a static one representing an individual
    like Grants.gov did.
    """
    organization = context.application_form.application.organization
    if organization is None:
        return INDIVIDUAL_UEI

    # This shouldn't happen during our pilot as all orgs should be created
    # from sam.gov entity data in the first place, but just as a safety net
    if organization.sam_gov_entity is None:
        logger.error(
            "Organization does not have a sam.gov entity, cannot determine UEI",
            extra={"organization_id": organization.organization_id},
        )
        return INDIVIDUAL_UEI

    return organization.sam_gov_entity.uei


def get_assistance_listing_number(context: JsonRuleContext, json_rule: JsonRule) -> str | None:
    """Get the assistance listing number attached to the competition"""
    competition = context.application_form.application.competition

    # These can be null, not every competition has an assistance listing number attached
    if competition.opportunity_assistance_listing is None:
        return None

    return competition.opportunity_assistance_listing.assistance_listing_number


def get_assistance_listing_program_title(
    context: JsonRuleContext, json_rule: JsonRule
) -> str | None:
    """Get the assistance listing program title attached to the competition"""
    competition = context.application_form.application.competition

    # These can be null, not every competition has an assistance listing number attached
    if competition.opportunity_assistance_listing is None:
        return None

    return competition.opportunity_assistance_listing.program_title


def get_public_competition_id(context: JsonRuleContext, json_rule: JsonRule) -> str | None:
    """Get the public competition ID from the competition"""
    competition = context.application_form.application.competition
    return competition.public_competition_id


def get_competition_title(context: JsonRuleContext, json_rule: JsonRule) -> str | None:
    """Get the competition title from the competition"""
    competition = context.application_form.application.competition
    return competition.competition_title


def get_signature(context: JsonRuleContext, json_rule: JsonRule) -> str | None:
    """Get the name of the owner of the application"""
    # TODO - we don't yet have users names, so this arbitrarily grabs
    # one users email attached to the app - not ideal, will fix when we can.
    app_users = context.application_form.application.application_users
    if len(app_users) > 0:
        return app_users[0].user.email

    return UNKNOWN_VALUE


def _convert_monetary_field(value: Any) -> Decimal:
    # We store monetary amounts as strings, for the purposes
    # of doing math, we want to convert those to Decimals
    if value is None:
        return ZERO_DECIMAL

    if not isinstance(value, str):
        raise ValueError("Cannot convert value to monetary field, is not a string")

    try:
        return Decimal(value)
    except InvalidOperation as e:
        raise ValueError("Invalid decimal format, cannot process") from e


def sum_monetary_values(context: JsonRuleContext, json_rule: JsonRule) -> str:
    """Sum monetary amounts based on configuration

    The rule schema for this needs to specify a set of fields
    that can be defined as either absolute paths or relative paths.
    Either can contain arrays ([*] or [1] on path params), if [*]
    is in a path, all values within that array will be summed.

    Value returned is a string of format "0.00" with two decimal points.

    If no values are fetched, "0.00" will be returned.
    """
    fields = json_rule.rule.get("fields", [])
    values = get_field_values(context.json_data, fields, json_rule.path)

    result = ZERO_DECIMAL
    for value in values:
        if value is None:
            continue

        # If a field cannot be converted to a monetary amount, we just
        # won't add it to the amount. These fields should have validation
        # on them that would flag it to a user.
        # For example, if a set of fields were 1.00, 2.00, "hello", and 3.00
        # we'd still want to produce "6.00" from this function as that seems
        # the most intuitive to a user.
        try:
            monetary_value = _convert_monetary_field(value)
        except ValueError:
            logger.info("Cannot convert monetary amount entered", extra=json_rule.get_log_context())
            continue
        result += monetary_value

    # Quantize will make the value always contain 2 values after the decimal.
    # Because our validation of monetary fields limits them to 2 decimals
    # this only matters when a user enters something that would be flagged
    # for a validation issue anyways, but at least this maintains consistency.
    return str(result.quantize(ZERO_DECIMAL))


population_func = Callable[[JsonRuleContext, JsonRule], Any]

PRE_POPULATION_MAPPER: dict[str, population_func] = {
    "opportunity_number": get_opportunity_number,
    "opportunity_title": get_opportunity_title,
    "agency_name": get_agency_name,
    "uei": get_uei,
    "assistance_listing_number": get_assistance_listing_number,
    "assistance_listing_program_title": get_assistance_listing_program_title,
    "public_competition_id": get_public_competition_id,
    "competition_title": get_competition_title,
    "sum_monetary": sum_monetary_values,
}

POST_POPULATION_MAPPER: dict[str, population_func] = {
    "current_date": get_current_date,
    "signature": get_signature,
}


def handle_field_population(
    context: JsonRuleContext, json_rule: JsonRule, mapper: dict[str, population_func]
) -> None:

    rule_code: str | None = json_rule.rule.get("rule", None)
    remove_null_fields = json_rule.rule.get("null_population", EXCLUDE_VALUE) == EXCLUDE_VALUE
    log_extra = context.get_log_context() | json_rule.get_log_context()

    # If the rule code isn't configured right, log a warning to alert us, but
    # we'll proceed onward and not break the endpoint.
    if rule_code is None:
        logger.warning("Rule code is null for configuration", extra=log_extra)
        return
    if rule_code not in mapper:
        logger.warning("Rule code does not have a defined mapper", extra=log_extra)
        return

    rule_func = mapper[rule_code]
    try:
        value = rule_func(context, json_rule)
        context.json_data = populate_nested_value(
            context.json_data, json_rule.path, value, remove_null_fields=remove_null_fields
        )
    except ValueError:
        # If a value error occurred, something unexpected happened with the data/config
        # we don't want to fail, so instead we'll proceed on. This will only be blocking
        # if the field is required for validation (logging an exception should alert us)
        logger.exception("Failed to handle field population", extra=log_extra)
