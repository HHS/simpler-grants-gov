import logging
import uuid
import zipfile

from faker import Faker
from sqlalchemy import select

import src.adapters.db as db
import tests.src.db.models.factories as factories
from src.constants.lookup_constants import ApplicationStatus, LegacyUserStatus, OpportunityStatus
from src.constants.static_role_values import ORG_ADMIN, ORG_MEMBER
from src.db.models.competition_models import Application, Competition
from src.db.models.entity_models import Organization
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    Opportunity,
    OpportunitySummary,
)
from src.db.models.user_models import User
from src.form_schema.forms.project_abstract_summary import ProjectAbstractSummary_v2_0
from src.form_schema.forms.sf424 import SF424_v4_0
from src.form_schema.forms.sf424a import SF424a_v1_0
from src.services.applications.application_validation import (
    ApplicationAction,
    validate_application_form,
)
from src.util import file_util
from tests.lib.legacy_user_test_utils import create_legacy_user_with_status
from tests.lib.seed_data_utils import CompetitionContainer, UserBuilder

faker = Faker()

logger = logging.getLogger(__name__)


#############################################################
# Utilities for building data
#############################################################


def setup_org(
    db_session: db.Session, organization_id: uuid.UUID, legal_business_name: str, uei: str
) -> Organization:
    organization = db_session.execute(
        select(Organization).where(Organization.organization_id == organization_id)
    ).scalar_one_or_none()
    if organization is None:
        organization = Organization(organization_id=organization_id)
        db_session.add(organization)

    if organization.sam_gov_entity is None:
        sam_gov_entity = factories.SamGovEntityFactory.build(
            uei=uei, legal_business_name=legal_business_name
        )
        db_session.add(sam_gov_entity)
        organization.sam_gov_entity = sam_gov_entity

    organization.sam_gov_entity.uei = uei
    organization.sam_gov_entity.legal_business_name = legal_business_name

    return organization


#############################################################
# Build org / users / apps
#############################################################


def _build_organizations_and_users(
    db_session: db.Session, competition_container: CompetitionContainer
) -> None:
    logger.info("Creating/updating organizations and users")
    ############################################
    # Organization 1
    ############################################
    org1 = setup_org(
        db_session,
        organization_id=uuid.UUID("47d95649-c70d-44d9-ae78-68bf848e32f8"),
        legal_business_name="Sally's Soup Emporium",
        uei="FAKEUEI11111",
    )

    ############################################
    # Organization 2
    ############################################
    org2 = setup_org(
        db_session,
        organization_id=uuid.UUID("50a7692e-743b-4c7b-bdb0-46ae087db33c"),
        legal_business_name="Fred's Fabric Hut",
        uei="FAKEUEI22222",
    )

    ############################################
    # Organization 3
    ############################################
    org3 = setup_org(
        db_session,
        organization_id=uuid.UUID("71507bdc-fa0e-44a7-b17c-d79d15320476"),
        legal_business_name="Michelangelo's Moderately Malevolent Moving Marketplace",
        uei="FAKEUEI33333",
    )

    ##############################################################
    # Users
    ##############################################################
    user_scenarios = []

    ###############################
    # User without organizations
    ###############################
    user_no_orgs = (
        UserBuilder(
            uuid.UUID("a3f77afe-c293-414b-a2c0-53c1be5f2936"), db_session, "user with no orgs"
        )
        .with_oauth_login("no_org_user")
        .with_api_key("no_org_user_key")
        .with_jwt_auth()
        .build()
    )

    user_scenarios.append("no_org_user - Individual user (no organizations)")

    _add_saved_opportunities(user_no_orgs, db_session)
    _add_saved_searches(user_no_orgs, db_session)

    ###############################
    # User with a single organization
    ###############################
    (
        UserBuilder(
            uuid.UUID("f15c7491-7ebc-4f4f-8de6-3ac0594d9c63"), db_session, "user with one org"
        )
        .with_oauth_login("one_org_user")
        .with_api_key("one_org_user_key")
        .with_jwt_auth()
        .with_organization(org1, roles=[ORG_ADMIN])
        .build()
    )

    user_scenarios.append("one_org_user - Organization admin (Sally's Soup Emporium)")

    ###############################
    # User with two organizations
    ###############################
    (
        UserBuilder(
            uuid.UUID("0f4ae584-c310-472d-9d6c-57201b5f84cc"), db_session, "user with two orgs"
        )
        .with_oauth_login("two_org_user")
        .with_api_key("two_org_user_key")
        .with_jwt_auth()
        .with_organization(org1, roles=[ORG_ADMIN])
        .with_organization(org2, roles=[ORG_ADMIN])
        .build()
    )

    user_scenarios.append("two_org_user - Organization admin (both organizations)")

    ###############################
    # User as organization member (not admin)
    ###############################

    (
        UserBuilder(
            uuid.UUID("b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e"), db_session, "user as org member"
        )
        .with_oauth_login("org_member_user")
        .with_api_key("org_member_user_key")
        .with_jwt_auth()
        .with_organization(org1, roles=[ORG_MEMBER])
        .build()
    )

    user_scenarios.append("org_member_user - Organization member (Sally's Soup Emporium)")

    ###############################
    # User with mixed organization roles
    ###############################

    (
        UserBuilder(
            uuid.UUID("f5a6b7c8-d9e0-4f1a-2b3c-4d5e6f7a8b9c"),
            db_session,
            "user with mixed org roles",
        )
        .with_oauth_login("mixed_roles_user")
        .with_api_key("mixed_roles_user_key")
        .with_jwt_auth()
        .with_organization(org1, roles=[ORG_ADMIN])
        .with_organization(org2, roles=[ORG_MEMBER])
        .build()
    )

    user_scenarios.append("mixed_roles_user - Admin of ORG1, Member of ORG2")

    ###############################
    # User with many applications across orgs
    ###############################

    many_app_user = (
        UserBuilder(
            uuid.UUID("5b4807c5-57d4-4867-b722-1658b47c59ba"),
            db_session,
            "user with many different applications",
        )
        .with_oauth_login("many_app_user")
        .with_api_key("many_app_user_key")
        .with_jwt_auth()
        .with_organization(org1, roles=[ORG_ADMIN])
        .with_organization(org2, roles=[ORG_ADMIN])
        .with_organization(org3, roles=[ORG_ADMIN])
        .build()
    )

    user_scenarios.append("many_app_user - Has many applications across many orgs")

    ########################
    # Legacy users for orgs
    ########################
    _build_legacy_users_for_orgs(
        orgs=[org1, org2, org3],
        inviter=many_app_user,
    )

    ########################
    # Apps for many_app_user
    ########################

    if competition_container is not None:
        # A static application against the static competition
        # which the frontend wants to make a quick way to get to the app page
        _add_application(
            db_session,
            competition=competition_container.static_competition_with_all_forms,
            app_owner=many_app_user,
            application_name="Static All-form App",
            static_application_id=uuid.UUID("892a6aa8-92b1-46c2-a26b-21a6aaab825d"),
        )

        # An application started against the competition with all forms
        _add_application(
            db_session,
            competition=competition_container.competition_with_all_forms,
            app_owner=org3,
            application_name="All forms",
        )

        # An application for each competition that has a form
        for form, competition in competition_container.form_specific_competitions.values():
            _add_application(
                db_session,
                competition=competition,
                app_owner=org2,
                application_name=f"App for {form.short_form_name}",
            )

        # Very long application names
        _add_application(
            db_session,
            competition=competition_container.get_comp_for_form(SF424a_v1_0),
            app_owner=many_app_user,
            application_name="My really really really long Individual application name that'll take up a lot of space",
        )
        _add_application(
            db_session,
            competition=competition_container.get_comp_for_form(SF424_v4_0),
            app_owner=org3,
            application_name="My quite long organization application name that'll take up almost as much space",
        )

        # Applications in other statuses
        _add_application(
            db_session,
            competition=competition_container.get_comp_for_form(ProjectAbstractSummary_v2_0),
            app_owner=many_app_user,
            application_status=ApplicationStatus.SUBMITTED,
            application_name="Submitted individual app",
        )
        _add_application(
            db_session,
            competition=competition_container.get_comp_for_form(SF424_v4_0),
            app_owner=org2,
            application_status=ApplicationStatus.SUBMITTED,
            application_name="Submitted org app",
        )

        _add_application(
            db_session,
            competition=competition_container.competition_with_all_forms,
            app_owner=many_app_user,
            application_status=ApplicationStatus.ACCEPTED,
            application_name="Accepted individual app",
        )
        _add_application(
            db_session,
            competition=competition_container.get_comp_for_form(SF424_v4_0),
            app_owner=org2,
            application_status=ApplicationStatus.ACCEPTED,
            application_name="Accepted org app",
        )

    ###############################
    # API-only user for local development
    ###############################
    (
        UserBuilder(
            uuid.UUID("12345678-1234-5678-9abc-123456789abc"),
            db_session,
            "API-only user for local development",
        )
        .with_api_key("local-dev-api-key")
        .build()
    )

    user_scenarios.append("api_user - API-only user (no OAuth, API key only)")

    ##############################################################
    # Log output
    ##############################################################

    # Log summary of all created user scenarios
    logger.info("=== USER SCENARIOS SUMMARY ===")
    logger.info(f"Created {len(user_scenarios)} user scenarios with role-based access:")
    for scenario in user_scenarios:
        logger.info(f"• {scenario}")


def _add_saved_opportunities(user: User, db_session: db.Session, count: int = 5) -> None:
    # Grab some recently made opportunities
    opportunities: list = (
        db_session.execute(
            select(Opportunity)
            .join(CurrentOpportunitySummary)
            .join(OpportunitySummary)
            .where(
                CurrentOpportunitySummary.opportunity_status.in_(
                    [OpportunityStatus.POSTED, OpportunityStatus.FORECASTED]
                )
            )
            .order_by(OpportunitySummary.close_date.asc())
            .limit(40)
        )
        .scalars()
        .all()
    )

    current_saved_opportunity_ids = {o.opportunity_id for o in user.saved_opportunities}

    added_saved_opps_count = 0
    for opportunity in opportunities:
        if added_saved_opps_count >= count:
            break
        # If they already have that opportunity ID saved, don't try to add it again
        if opportunity.opportunity_id in current_saved_opportunity_ids:
            continue

        factories.UserSavedOpportunityFactory.create(user=user, opportunity=opportunity)
        added_saved_opps_count += 1


def _add_saved_searches(user: User, db_session: db.Session, count: int = 2) -> None:
    # Grab some opportunity IDs
    # These won't realistically be something we would have returned
    # for these search, but just to have them line up with real opportunities
    opportunity_ids: list = (
        db_session.execute(
            select(Opportunity.opportunity_id).join(CurrentOpportunitySummary).limit(25)
        )
        .scalars()
        .all()
    )

    for _ in range(count):
        word = factories.fake.word()
        factories.UserSavedSearchFactory.create(
            user=user,
            name=f"Saved search '{word}'",
            search_query={
                "query": word,
                "format": "json",
                "filters": {"opportunity_status": {"one_of": ["forecasted", "posted"]}},
                "pagination": {
                    "page_size": 25,
                    "sort_order": [
                        {"order_by": "relevancy", "sort_direction": "descending"},
                        {"order_by": "close_date", "sort_direction": "ascending"},
                    ],
                    "page_offset": 1,
                },
                "query_operator": "AND",
            },
            searched_opportunity_ids=opportunity_ids,
        )


def _add_application(
    db_session: db.Session,
    competition: Competition,
    application_name: str,
    app_owner: User | Organization,
    application_status: ApplicationStatus = ApplicationStatus.IN_PROGRESS,
    static_application_id: uuid.UUID | None = None,
) -> Application:
    app_params: dict = {
        "competition": competition,
        "application_status": application_status,
        "application_name": application_name,
    }

    if isinstance(app_owner, Organization):
        app_params["organization"] = app_owner
        app_type = "organization"
    else:
        app_type = "individual"

    if static_application_id is not None:
        existing_static_app = db_session.execute(
            select(Application).where(Application.application_id == static_application_id)
        ).scalar_one_or_none()

        # If the app already exists, we only
        # want to make sure all the forms are present.
        # Note that if you do this with an app that has a submission zip
        # it won't magically update that zip as that'd be really complex
        # to fix the ZIP and this function already has enough going on
        if existing_static_app:
            logger.info(
                f"Static application {static_application_id} already exists, no need to recreate."
            )
            handle_static_application_forms(existing_static_app, competition)
            return existing_static_app

        # App doesn't exist
        app_params["application_id"] = static_application_id

    logger.info(f"Creating an {app_type} application '{application_name}'")
    application = factories.ApplicationFactory.create(**app_params)

    # To mimic how start-application behaves, only add an application
    # owner user if it's not an organization. In the future we can
    # make this function also let you add users to the app, but not using that much yet.
    if isinstance(app_owner, User):
        factories.ApplicationUserFactory(application=application, user=app_owner, as_owner=True)

    # This bit is mostly copied from the start application endpoint
    # and at least sets up the application forms with prepopulation run
    for competition_form in competition.competition_forms:
        application_form = factories.ApplicationFormFactory.create(
            application=application, competition_form=competition_form, application_response={}
        )

        validate_application_form(application_form, ApplicationAction.START)

    # If submitted, also at least fill out the post-population values
    if application_status in (ApplicationStatus.SUBMITTED, ApplicationStatus.ACCEPTED):
        for application_form in application.application_forms:
            validate_application_form(application_form, ApplicationAction.SUBMIT)

    # We make a very very rough approximation of what an application submission
    # looks like. We make a ZIP file with roughly the files we'd expect in it
    # although they won't be PDFs or properly formatted.
    if application_status == ApplicationStatus.ACCEPTED:
        s3_path = f"s3://local-mock-public-bucket/applications/{application.application_id}/submissions/{uuid.uuid4()}/submission.zip"
        with file_util.open_stream(s3_path, "wb") as outfile:
            with zipfile.ZipFile(outfile, "w") as submission_zip:

                # Create a dummy manifest file
                with submission_zip.open("manifest.txt", "w") as manifest_file:
                    manifest_file.write(
                        f"Manifest for Grant Application {application.application_id}".encode(
                            "utf-8"
                        )
                    )

                # Add a file for each application form
                # Note we make these text files as even a very simple
                # PDF is quite complex
                for app_form in application.application_forms:
                    with submission_zip.open(
                        f"{app_form.form.short_form_name}.txt", "w"
                    ) as form_file:
                        form_file.write(str(app_form.application_response).encode("utf-8"))

                # Add some random attachments
                with submission_zip.open("dummy-attachment-1.txt", "w") as dummy_attachment:
                    dummy_attachment.write(b"This is an attachment file")

                with submission_zip.open("dummy-attachment-2.txt", "w") as dummy_attachment:
                    dummy_attachment.write(b"This is a different attachment file")

        factories.ApplicationSubmissionFactory(
            application=application, file_location=s3_path, file_contents="SKIP"
        )

    return application


def handle_static_application_forms(application: Application, competition: Competition):
    existing_comp_forms_on_app = [
        app_form.competition_form_id for app_form in application.application_forms
    ]

    for competition_form in competition.competition_forms:
        if competition_form.competition_form_id in existing_comp_forms_on_app:
            continue

        logger.info(
            f"Adding new form {competition_form.form.form_name} to static application {application.application_id}"
        )
        application_form = factories.ApplicationFormFactory.create(
            application=application, competition_form=competition_form, application_response={}
        )

        validate_application_form(application_form, ApplicationAction.START)


def _build_legacy_users_for_orgs(
    orgs: list[Organization],
    inviter: User,
) -> None:
    """
    Creates legacy users for each org to support invite lifecycle testing.
    """
    # AVAILABLE legacy users
    for i, org in enumerate(orgs, start=1):
        create_legacy_user_with_status(
            uei=org.sam_gov_entity.uei,
            email=faker.email(),
            status=LegacyUserStatus.AVAILABLE,
            organization=org,
            first_name=f"Legacy{i}",
            last_name="Available",
        )
        logger.info(
            f"legacy_available_org{i} - Legacy user for {org.organization_name}, invite not sent"
        )

    # MEMBER legacy users
    for i, org in enumerate(orgs, start=1):
        create_legacy_user_with_status(
            uei=org.sam_gov_entity.uei,
            email=faker.email(),
            status=LegacyUserStatus.MEMBER,
            organization=org,
            first_name=f"Legacy{i}",
            last_name="Member",
        )
        logger.info(f"legacy_member_org{i} - Legacy user already member of {org.organization_name}")

    # Single PENDING invite
    create_legacy_user_with_status(
        uei=orgs[1].sam_gov_entity.uei,
        email=faker.email(),
        status=LegacyUserStatus.PENDING_INVITATION,
        organization=orgs[1],
        inviter=inviter,
        first_name="Legacy",
        last_name="Pending",
    )
    logger.info("legacy_pending_org2 - Legacy user invited to ORG2, invite pending")
