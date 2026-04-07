import logging
import random
import uuid

import src.adapters.db as db
import tests.src.db.models.factories as factories
from src.constants.lookup_constants import (
    ApplicationStatus,
    AwardRecommendationStatus,
    AwardRecommendationType,
    AwardSelectionMethod,
)
from src.db.models.agency_models import Agency
from src.db.models.award_recommendation_models import AwardRecommendation
from src.db.models.competition_models import Application, ApplicationSubmission, Competition
from tests.lib.seed_orgs_and_users import _add_application

logger = logging.getLogger(__name__)


def _build_award_recommendations(
    db_session: db.Session, agencies: list[Agency] | None = None
) -> None:
    """
    Create award recommendations with application submissions for testing.

    Args:
        db_session: Database session
        agencies: Optional list of agencies to associate opportunities with for auth.
                  If None, opportunities will be created without specific agency associations.

    This creates various scenarios:
    - Award recommendations in different statuses (draft, in_review, approved)
    - Multiple application submissions per award recommendation
    - Different recommendation types (recommended for funding, not recommended, etc.)
    - Various selection methods
    """
    logger.info("Creating award recommendations with application submissions")

    competition, applications = _create_competition_with_accepted_applications(db_session, agencies)

    logger.info(
        f"Processing opportunity {competition.opportunity.opportunity_number} with {len(applications)} accepted applications"
    )

    award_recommendations_created = []
    award_recommendations_created.extend(
        _create_draft_scenario(db_session, competition, applications)
    )
    award_recommendations_created.extend(
        _create_in_review_scenario(db_session, competition, applications)
    )
    award_recommendations_created.extend(
        _create_approved_scenario(db_session, competition, applications)
    )
    award_recommendations_created.extend(
        _create_exception_scenario(db_session, competition, applications)
    )
    award_recommendations_created.extend(
        _create_static_scenario(db_session, competition, applications)
    )

    _log_summary(award_recommendations_created)


def _create_draft_scenario(
    db_session: db.Session, competition: Competition, applications: list[Application]
) -> list[tuple]:
    """Create draft award recommendation with mixed recommendation types."""
    draft_ar = factories.AwardRecommendationFactory.create(
        opportunity=competition.opportunity,
        award_recommendation_status=AwardRecommendationStatus.DRAFT,
        award_selection_method=AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY,
        additional_info="This is a draft award recommendation for initial review.",
    )

    apps_added = 0
    for idx, app in enumerate(applications[:10]):
        if not app.application_submissions:
            continue

        if idx < 6:
            rec_type = AwardRecommendationType.RECOMMENDED_FOR_FUNDING
            amount = 50000
        elif idx < 8:
            rec_type = AwardRecommendationType.RECOMMENDED_WITHOUT_FUNDING
            amount = 0
        else:
            rec_type = AwardRecommendationType.NOT_RECOMMENDED
            amount = 0

        _add_application_to_award_recommendation(
            db_session,
            draft_ar,
            app.application_submissions[0],
            recommended_amount=amount,
            award_recommendation_type=rec_type,
        )
        apps_added += 1

    logger.info(
        f"Created draft AR {draft_ar.award_recommendation_number} with {apps_added} applications"
    )
    return [(draft_ar, "Draft", competition.opportunity.opportunity_number)]


def _create_in_review_scenario(
    db_session: db.Session, competition: Competition, applications: list[Application]
) -> list[tuple]:
    """Create in-review award recommendation with detailed comments."""
    if len(applications) <= 10:
        return []

    in_progress_ar = factories.AwardRecommendationFactory.create(
        opportunity=competition.opportunity,
        award_recommendation_status=AwardRecommendationStatus.IN_REVIEW,
        award_selection_method=AwardSelectionMethod.MERIT_REVIEW_RANKING_WITH_OTHER_FACTORS,
        selection_method_detail="Using merit-based review process with three rounds",
        additional_info="Award recommendation currently being reviewed by panel.",
    )

    apps_added = 0
    for i, app in enumerate(applications[10:20]):
        if not app.application_submissions:
            continue
        apps_added += 1

        if i < 5:
            _add_application_to_award_recommendation(
                db_session,
                in_progress_ar,
                app.application_submissions[0],
                recommended_amount=75000,
                award_recommendation_type=AwardRecommendationType.RECOMMENDED_FOR_FUNDING,
                scoring_comment="85",
                general_comment="Strong proposal with clear objectives and methodology.",
            )
        elif i < 8:
            _add_application_to_award_recommendation(
                db_session,
                in_progress_ar,
                app.application_submissions[0],
                recommended_amount=0,
                award_recommendation_type=AwardRecommendationType.RECOMMENDED_WITHOUT_FUNDING,
                scoring_comment="72",
                general_comment="Good proposal but limited funding available.",
            )
        else:
            _add_application_to_award_recommendation(
                db_session,
                in_progress_ar,
                app.application_submissions[0],
                recommended_amount=0,
                award_recommendation_type=AwardRecommendationType.NOT_RECOMMENDED,
                scoring_comment="58",
                general_comment="Does not meet minimum requirements for this opportunity.",
            )

    logger.info(
        f"Created in-review AR {in_progress_ar.award_recommendation_number} with {apps_added} applications"
    )
    return [(in_progress_ar, "In Review", competition.opportunity.opportunity_number)]


def _create_approved_scenario(
    db_session: db.Session, competition: Competition, applications: list[Application]
) -> list[tuple]:
    """Create approved award recommendation with final decisions."""
    if len(applications) <= 15:
        return []

    approved_ar = factories.AwardRecommendationFactory.create(
        opportunity=competition.opportunity,
        award_recommendation_status=AwardRecommendationStatus.APPROVED,
        award_selection_method=AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY,
        additional_info="Final approved recommendations ready for award issuance.",
    )

    apps_added = 0
    for i, app in enumerate(applications[15:20]):
        if not app.application_submissions:
            continue
        apps_added += 1

        if i < 3:
            _add_application_to_award_recommendation(
                db_session,
                approved_ar,
                app.application_submissions[0],
                recommended_amount=65000 - (i * 5000),
                award_recommendation_type=AwardRecommendationType.RECOMMENDED_FOR_FUNDING,
                scoring_comment="92",
                general_comment="Approved for funding - meets all criteria.",
            )
        elif i < 4:
            _add_application_to_award_recommendation(
                db_session,
                approved_ar,
                app.application_submissions[0],
                recommended_amount=0,
                award_recommendation_type=AwardRecommendationType.RECOMMENDED_WITHOUT_FUNDING,
                scoring_comment="78",
                general_comment="Meritorious but funds exhausted.",
            )
        else:
            _add_application_to_award_recommendation(
                db_session,
                approved_ar,
                app.application_submissions[0],
                recommended_amount=0,
                award_recommendation_type=AwardRecommendationType.NOT_RECOMMENDED,
                scoring_comment="65",
                general_comment="Does not meet funding threshold.",
            )

    logger.info(
        f"Created approved AR {approved_ar.award_recommendation_number} with {apps_added} applications"
    )
    return [(approved_ar, "Approved", competition.opportunity.opportunity_number)]


def _create_exception_scenario(
    db_session: db.Session, competition: Competition, applications: list[Application]
) -> list[tuple]:
    """Create award recommendation with exception case."""
    if len(applications) <= 20 or not applications[20].application_submissions:
        return []

    exception_ar = factories.AwardRecommendationFactory.create(
        opportunity=competition.opportunity,
        award_recommendation_status=AwardRecommendationStatus.DRAFT,
        award_selection_method=AwardSelectionMethod.SOLE_SOURCE,
        additional_info="Special circumstances require sole source selection.",
    )

    detail = factories.AwardRecommendationSubmissionDetailFactory.create(
        recommended_amount=100000,
        award_recommendation_type=AwardRecommendationType.RECOMMENDED_FOR_FUNDING,
        scoring_comment="N/A",
        general_comment="Awarded under special authorization.",
        has_exception=True,
        exception_detail="Sole source provider with unique capabilities.",
    )

    factories.AwardRecommendationApplicationSubmissionFactory.create(
        award_recommendation=exception_ar,
        application_submission=applications[20].application_submissions[0],
        award_recommendation_submission_detail=detail,
    )
    logger.info(
        f"Created exception AR {exception_ar.award_recommendation_number} with 1 application"
    )
    return [(exception_ar, "With Exception", competition.opportunity.opportunity_number)]


def _create_static_scenario(
    db_session: db.Session, competition: Competition, applications: list[Application]
) -> list[tuple]:
    """Create static award recommendation with known ID for E2E testing."""
    static_ar_id = uuid.UUID("b9c15d13-8ff1-4e15-80b8-3cf5acf84851")
    existing_static_ar = db_session.get(AwardRecommendation, static_ar_id)

    if existing_static_ar:
        logger.info(f"Static award recommendation {static_ar_id} already exists, skipping creation")
        return []

    if not applications:
        return []

    logger.info(f"Creating static AR with {len(applications[:10])} applications")
    static_ar = factories.AwardRecommendationFactory.create(
        award_recommendation_id=static_ar_id,
        opportunity=competition.opportunity,
        award_recommendation_status=AwardRecommendationStatus.DRAFT,
        award_selection_method=AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY,
        additional_info="Static award recommendation for E2E testing.",
    )

    apps_added = 0
    for i, app in enumerate(applications[:10]):
        if not app.application_submissions:
            logger.warning(f"Application {app.application_id} has no submissions, skipping")
            continue
        apps_added += 1

        if i < 5:
            rec_type = AwardRecommendationType.RECOMMENDED_FOR_FUNDING
            amount = 60000 - (i * 5000)
            comment = f"Recommended for funding - Rank #{i + 1}"
            score = f"{90 - i * 2}"
        elif i < 7:
            rec_type = AwardRecommendationType.RECOMMENDED_WITHOUT_FUNDING
            amount = 0
            comment = "Meritorious but insufficient funds"
            score = "75"
        else:
            rec_type = AwardRecommendationType.NOT_RECOMMENDED
            amount = 0
            comment = "Does not meet minimum criteria"
            score = f"{65 - (i - 7) * 5}"

        _add_application_to_award_recommendation(
            db_session,
            static_ar,
            app.application_submissions[0],
            recommended_amount=amount,
            award_recommendation_type=rec_type,
            scoring_comment=score,
            general_comment=comment,
        )

    logger.info(
        f"Created static AR {static_ar.award_recommendation_number} with {apps_added} applications"
    )
    logger.info(
        f"✓ Static award recommendation ready - http://localhost:3000/award-recommendation/{static_ar_id}/edit"
    )
    return [(static_ar, "Static (E2E)", competition.opportunity.opportunity_number)]


def _log_summary(award_recommendations_created: list[tuple]) -> None:
    """Log summary of created award recommendations."""
    logger.info("")
    logger.info("=" * 80)
    logger.info("=== AWARD RECOMMENDATIONS CREATED ===")
    logger.info(f"Created {len(award_recommendations_created)} award recommendations")
    logger.info("=" * 80)
    for ar, status, opp_num in award_recommendations_created:
        submission_count = len(ar.award_recommendation_application_submissions)
        logger.info("")
        logger.info(f"✓ {status} AR: {ar.award_recommendation_number}")
        logger.info(f"  Opportunity: {opp_num}")
        logger.info(f"  Applications: {submission_count}")
        logger.info(
            f"  URL: http://localhost:3000/award-recommendation/{ar.award_recommendation_id}/edit"
        )
    logger.info("")
    logger.info("=" * 80)


def _add_application_to_award_recommendation(
    db_session: db.Session,
    award_recommendation: AwardRecommendation,
    application_submission: ApplicationSubmission,
    recommended_amount: int = 0,
    award_recommendation_type: AwardRecommendationType = AwardRecommendationType.RECOMMENDED_FOR_FUNDING,
    scoring_comment: str | None = None,
    general_comment: str | None = None,
) -> None:
    """Helper to add an application submission to an award recommendation."""
    factory_kwargs = {
        "award_recommendation": award_recommendation,
        "application_submission": application_submission,
    }

    if award_recommendation_type == AwardRecommendationType.RECOMMENDED_FOR_FUNDING:
        factory_kwargs["recommended_for_funding"] = True
        if recommended_amount != 50000:
            factory_kwargs["award_recommendation_submission_detail__recommended_amount"] = (
                recommended_amount
            )
    elif award_recommendation_type == AwardRecommendationType.RECOMMENDED_WITHOUT_FUNDING:
        factory_kwargs["recommended_without_funding"] = True
    elif award_recommendation_type == AwardRecommendationType.NOT_RECOMMENDED:
        factory_kwargs["not_recommended"] = True

    if scoring_comment is not None:
        factory_kwargs["award_recommendation_submission_detail__scoring_comment"] = scoring_comment
    if general_comment is not None:
        factory_kwargs["award_recommendation_submission_detail__general_comment"] = general_comment

    factories.AwardRecommendationApplicationSubmissionFactory.create(**factory_kwargs)


def _create_competition_with_accepted_applications(
    db_session: db.Session, agencies: list[Agency] | None = None
) -> tuple[Competition, list[Application]]:
    """Create a competition with many accepted applications for comprehensive testing.

    Args:
        db_session: Database session
        agencies: Optional list of agencies to associate the opportunity with.

    Returns:
        Tuple of (competition, applications list)
    """
    logger.info("")
    logger.info(
        "Creating a competition with 25 accepted applications for award recommendation testing..."
    )

    competition_kwargs = {
        "opportunity__opportunity_title": "Award Recommendation Test Opportunity",
    }
    if agencies and len(agencies) > 0:
        competition_kwargs["opportunity__agency_code"] = agencies[0].agency_code
        logger.info(f"Associating opportunity with agency: {agencies[0].agency_code}")

    competition = factories.CompetitionFactory.create(**competition_kwargs)

    logger.info("Creating 8 fresh organizations for applications")
    organizations = []
    for _ in range(8):
        unique_uei = f"UEI{random.randint(10000000, 99999999):08d}"
        org = factories.OrganizationFactory.create(sam_gov_entity__uei=unique_uei)
        organizations.append(org)

    applications = []
    for i in range(25):
        org = organizations[i % len(organizations)]
        app = _add_application(
            db_session=db_session,
            competition=competition,
            application_name=f"Test Application {i + 1}",
            app_owner=org,
            application_status=ApplicationStatus.SUBMITTED,
        )

        factories.ApplicationSubmissionFactory(
            application=app,
            file_location=f"s3://test-bucket/submissions/{app.application_id}.zip",
            file_contents="SKIP",
        )
        app.application_status = ApplicationStatus.ACCEPTED
        db_session.add(app)
        applications.append(app)

    logger.info(f"✓ Created competition '{competition.opportunity.opportunity_title}'")
    logger.info(f"  Competition ID: {competition.competition_id}")
    logger.info(f"  Opportunity ID: {competition.opportunity_id}")
    logger.info("  Applications: 25 (all ACCEPTED status)")
    logger.info(f"  URL: http://localhost:3000/opportunity/{competition.opportunity_id}")
    logger.info("")

    return competition, applications
