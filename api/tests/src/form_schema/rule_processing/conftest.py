from src.form_schema.rule_processing.json_rule_context import JsonRuleConfig
from src.form_schema.rule_processing.json_rule_processor import JsonRuleContext
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationAttachmentFactory,
    ApplicationFactory,
    ApplicationFormFactory,
    ApplicationUserFactory,
    CompetitionFactory,
    CompetitionFormFactory,
    FormFactory,
    LinkExternalUserFactory,
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
    OrganizationFactory,
)


def setup_context(
    json_data: dict,
    rule_schema: dict | None,
    # These are various params that be set in the application
    # if the value is None, we'll just leave it to the factory to set.
    opportunity_number: str | None = None,
    opportunity_title: str | None = None,
    has_agency: bool = True,
    agency_name: str | None = None,
    agency_code: str | None = None,
    user_email: str | None = None,
    attachment_ids: list[str] | None = None,
    has_organization: bool = False,
    uei: str | None = None,
    has_assistance_listing_number: bool = True,
    assistance_listing_number: str | None = None,
    assistance_listing_program_title: str | None = None,
    public_competition_id: str | None = None,
    competition_title: str | None = None,
    # Configurational params
    do_pre_population: bool = True,
    do_post_population: bool = True,
    do_field_validation: bool = True,
):
    opp_params = {}
    agency_params = {}
    if has_agency:
        if agency_name is not None:
            agency_params["agency_name"] = agency_name
        agency = AgencyFactory.create(**agency_params)
        opp_params["agency_code"] = agency.agency_code
    elif agency_code is not None:
        opp_params["agency_code"] = agency_code

    if opportunity_number is not None:
        opp_params["opportunity_number"] = opportunity_number
    if opportunity_title is not None:
        opp_params["opportunity_title"] = opportunity_title

    opportunity = OpportunityFactory.create(**opp_params)

    opportunity_assistance_listing = None
    if has_assistance_listing_number:
        params = {
            "opportunity": opportunity,
            "assistance_listing_number": assistance_listing_number,
            "program_title": assistance_listing_program_title,
        }
        opportunity_assistance_listing = OpportunityAssistanceListingFactory.create(**params)

    competition_params = {
        "opportunity": opportunity,
        "competition_forms": [],
        "competition_title": competition_title,
        "public_competition_id": public_competition_id,
        "opportunity_assistance_listing": opportunity_assistance_listing,
    }

    competition = CompetitionFactory.create(**competition_params)
    form = FormFactory.create(form_rule_schema=rule_schema)
    competition_form = CompetitionFormFactory.create(competition=competition, form=form)

    organization = None
    if has_organization:
        organization_params = {}
        if uei is not None:
            organization_params["sam_gov_entity__uei"] = uei
        else:
            organization_params["sam_gov_entity"] = None
        organization = OrganizationFactory(**organization_params)

    application = ApplicationFactory.create(competition=competition, organization=organization)
    application_form = ApplicationFormFactory.create(
        application=application, competition_form=competition_form, application_response=json_data
    )

    if attachment_ids is not None:
        for attachment_id in attachment_ids:
            ApplicationAttachmentFactory.create(
                application_attachment_id=attachment_id, application=application
            )

    if user_email is not None:
        app_user = ApplicationUserFactory.create(application=application, is_application_owner=True)
        LinkExternalUserFactory.create(email=user_email, user=app_user.user)

    return JsonRuleContext(
        application_form,
        JsonRuleConfig(
            do_pre_population=do_pre_population,
            do_post_population=do_post_population,
            do_field_validation=do_field_validation,
        ),
    )
