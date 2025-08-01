import logging
from typing import Any, Callable

from src.form_schema.rule_processing.json_rule_context import JsonRuleContext
from src.form_schema.rule_processing.json_rule_util import populate_nested_value
from src.util.datetime_util import get_now_us_eastern_date

logger = logging.getLogger(__name__)

INDIVIDUAL_UEI = "000000000INDV"


def get_opportunity_number(context: JsonRuleContext) -> str | None:
    """Get the opportunity number"""
    return context.opportunity.opportunity_number


def get_opportunity_title(context: JsonRuleContext) -> str | None:
    """Get the opportunity title"""
    return context.opportunity.opportunity_title


def get_agency_name(context: JsonRuleContext) -> str | None:
    """Get the agency's name, falling back to agency code if no agency name"""
    if context.opportunity.agency_name is None:
        return context.opportunity.agency_code

    return context.opportunity.agency_name


def get_current_date(context: JsonRuleContext) -> str:
    """Get the current date"""
    return get_now_us_eastern_date().isoformat()


def get_uei(context: JsonRuleContext) -> str:
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


def get_assistance_listing_number(context: JsonRuleContext) -> str | None:
    """Get the assistance listing number attached to the competition"""
    competition = context.application_form.application.competition

    if competition.opportunity_assistance_listing is None:
        return None

    return competition.opportunity_assistance_listing.assistance_listing_number


def get_assistance_listing_program_title(context: JsonRuleContext) -> str | None:
    """Get the assistance listing program title attached to the competition"""
    competition = context.application_form.application.competition

    if competition.opportunity_assistance_listing is None:
        return None

    return competition.opportunity_assistance_listing.program_title


def get_public_competition_id(context: JsonRuleContext) -> str | None:
    """Get the public competition ID from the competition"""
    competition = context.application_form.application.competition
    return competition.public_competition_id


def get_competition_title(context: JsonRuleContext) -> str | None:
    """Get the competition title from the competition"""
    competition = context.application_form.application.competition
    return competition.competition_title


def get_signature(context: JsonRuleContext) -> str | None:
    """Get the name of the owner of the application"""
    # TODO - we don't yet have users names, so this arbitrarily grabs
    # one users email attached to the app - not ideal, will fix when we can.
    app_users = context.application_form.application.application_users
    if len(app_users) > 0:
        return app_users[0].user.email

    return "unknown"


population_func = Callable[[JsonRuleContext], Any]

PRE_POPULATION_MAPPER: dict[str, population_func] = {
    "opportunity_number": get_opportunity_number,
    "opportunity_title": get_opportunity_title,
    "agency_name": get_agency_name,
    "uei": get_uei,
    "assistance_listing_number": get_assistance_listing_number,
    "assistance_listing_program_title": get_assistance_listing_program_title,
    "public_competition_id": get_public_competition_id,
    "competition_title": get_competition_title,
}

POST_POPULATION_MAPPER: dict[str, population_func] = {
    "current_date": get_current_date,
    "signature": get_signature,
}


def handle_field_population(
    context: JsonRuleContext, rule: dict, path: list[str], mapper: dict[str, population_func]
) -> None:
    rule_code: str | None = rule.get("rule", None)

    log_extra = context.get_log_context() | {
        "field_population_rule": rule_code,
        "path": ".".join(path),
    }

    # If the rule code isn't configured right, log a warning to alert us, but
    # we'll proceed onward and not break the endpoint.
    if rule_code is None:
        logger.warning("Rule code is null for configuration", extra=log_extra)
        return
    if rule_code not in mapper:
        logger.warning("Rule code does not have a defined mapper", extra=log_extra)
        return

    rule_func = mapper[rule_code]
    value = rule_func(context)

    try:
        context.json_data = populate_nested_value(context.json_data, path, value)
    except ValueError:
        # If a value error occurred, something unexpected happened with the data/config
        # we don't want to fail, so instead we'll proceed on. This will only be blocking
        # if the field is required for validation (logging an exception should alert us)
        logger.exception("Failed to handle field population", extra=log_extra)
