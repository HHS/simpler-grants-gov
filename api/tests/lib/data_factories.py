"""Factories for setting up data for specific scenarios

To help simplify setup when we need many factories repeatedly
with only a few alterations.
"""

from src.db.models.agency_models import Agency
from src.db.models.competition_models import ApplicationForm
from src.db.models.user_models import Role, User
from src.legacy_soap_api.legacy_soap_api_auth import SOAPClientCertificate
from tests.src.db.models.factories import (
    AgencyFactory,
    AgencyUserFactory,
    AgencyUserRoleFactory,
    ApplicationAttachmentFactory,
    ApplicationFactory,
    ApplicationFormFactory,
    ApplicationUserFactory,
    CompetitionFactory,
    CompetitionFormFactory,
    FormFactory,
    LegacyAgencyCertificateFactory,
    LinkExternalUserFactory,
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
    OrganizationFactory,
    RoleFactory,
)

DEFAULT_VALUE = object()


def setup_application_for_form_validation(
    json_data: dict,
    json_schema: dict,
    rule_schema: dict | None,
    # These are various params that be set in the application
    # if the value is None, we'll just leave it to the factory to set.
    opportunity_number: str | None = DEFAULT_VALUE,
    opportunity_title: str | None = DEFAULT_VALUE,
    has_agency: bool = True,
    agency_name: str | None = DEFAULT_VALUE,
    agency_code: str | None = None,
    user_email: str | None = None,
    attachment_ids: list[str] | None = None,
    deleted_attachment_ids: list[str] | None = None,
    has_organization: bool = False,
    uei: str | None = None,
    has_assistance_listing_number: bool = True,
    assistance_listing_number: str | None = None,
    assistance_listing_program_title: str | None = None,
    public_competition_id: str | None = None,
    competition_title: str | None = None,
) -> ApplicationForm:
    opp_params = {}
    agency_params = {}
    if has_agency:
        if agency_name is not DEFAULT_VALUE:
            agency_params["agency_name"] = agency_name
        agency = AgencyFactory.create(**agency_params)
        opp_params["agency_code"] = agency.agency_code
    else:
        opp_params["agency_code"] = agency_code

    if opportunity_number is not DEFAULT_VALUE:
        opp_params["opportunity_number"] = opportunity_number
    if opportunity_title is not DEFAULT_VALUE:
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
    form = FormFactory.create(form_json_schema=json_schema, form_rule_schema=rule_schema)
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
    if deleted_attachment_ids is not None:
        for attachment_id in deleted_attachment_ids:
            ApplicationAttachmentFactory.create(
                application_attachment_id=attachment_id, application=application, is_deleted=True
            )

    if user_email is not None:
        app_user = ApplicationUserFactory.create(application=application)
        LinkExternalUserFactory.create(email=user_email, user=app_user.user)

    return application_form


def setup_cert_user(agency: Agency, privileges: list) -> tuple[User, Role, SOAPClientCertificate]:
    legacy_certificate = LegacyAgencyCertificateFactory.create(agency=agency)
    agency_user = AgencyUserFactory.create(agency=agency, user=legacy_certificate.user)
    role = RoleFactory.create(privileges=privileges, is_agency_role=True)
    AgencyUserRoleFactory.create(agency_user=agency_user, role=role)
    soap_client_certificate = SOAPClientCertificate(
        serial_number=legacy_certificate.serial_number,
        cert="123",
        fingerprint="456",
        legacy_certificate=legacy_certificate,
    )
    return legacy_certificate.user, role, soap_client_certificate
