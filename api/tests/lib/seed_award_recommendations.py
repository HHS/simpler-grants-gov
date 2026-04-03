import logging
import uuid

from sqlalchemy import select

import src.adapters.db as db
import tests.src.db.models.factories as factories
from src.constants.lookup_constants import (
    ApplicationStatus,
    AwardRecommendationStatus,
    AwardRecommendationType,
    AwardSelectionMethod,
)
from src.db.models.award_recommendation_models import AwardRecommendation
from src.db.models.competition_models import Application, ApplicationSubmission, Competition

logger = logging.getLogger(__name__)


def _build_award_recommendations(db_session: db.Session) -> None:
    """
    Create award recommendations with application submissions for testing.

    This creates various scenarios:
    - Award recommendations in different statuses (draft, in progress, submitted)
    - Multiple application submissions per award recommendation
    - Different recommendation types (recommended for funding, not recommended, etc.)
    - Various selection methods
    """
    logger.info("Creating award recommendations with application submissions")

    # Get competitions with accepted applications
    competitions_with_apps = (
        db_session.execute(
            select(Competition)
            .join(Application)
            .join(ApplicationSubmission)
            .where(Application.application_status == ApplicationStatus.ACCEPTED)
            .distinct()
            .limit(5)
        )
        .scalars()
        .all()
    )

    logger.info(f"Found {len(competitions_with_apps)} competitions with accepted applications")

    # Check if we have at least one competition with enough applications (20+)
    competitions_with_enough_apps = []
    for comp in competitions_with_apps:
        app_count = (
            db_session.execute(
                select(Application).where(
                    Application.competition_id == comp.competition_id,
                    Application.application_status == ApplicationStatus.ACCEPTED,
                )
            )
            .scalars()
            .all()
        )
        if len(app_count) >= 20:
            competitions_with_enough_apps.append(comp)

    if not competitions_with_enough_apps:
        logger.info(
            "No competitions found with 20+ accepted applications. Creating one for comprehensive testing."
        )
        # Create a competition with many applications for testing
        competition = _create_competition_with_accepted_applications(db_session)
        competitions_with_apps = [competition] + competitions_with_apps[
            :4
        ]  # Use new + up to 4 existing

    award_recommendations_created = []

    for competition in competitions_with_apps:
        # Get accepted applications for this competition
        applications = (
            db_session.execute(
                select(Application)
                .where(
                    Application.competition_id == competition.competition_id,
                    Application.application_status == ApplicationStatus.ACCEPTED,
                )
                .limit(20)
            )
            .scalars()
            .all()
        )

        if not applications:
            logger.warning(
                f"No accepted applications found for competition {competition.competition_id}"
            )
            continue

        logger.info(
            f"Processing competition {competition.opportunity.opportunity_number} with {len(applications)} accepted applications"
        )

        # Scenario 1: Draft award recommendation with few applications
        draft_ar = factories.AwardRecommendationFactory.create(
            opportunity_id=competition.opportunity_id,
            award_recommendation_status=AwardRecommendationStatus.DRAFT,
            award_selection_method=AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY,
            additional_info="This is a draft award recommendation for initial review.",
        )

        # Add up to 10 applications to this award recommendation with mixed types
        apps_added_to_draft = 0
        for idx, app in enumerate(applications[:10]):
            if app.application_submissions:
                # Mix of all recommendation types in draft
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
                apps_added_to_draft += 1

        logger.info(
            f"Created draft AR {draft_ar.award_recommendation_number} with {apps_added_to_draft} applications"
        )

        award_recommendations_created.append(
            (draft_ar, "Draft", competition.opportunity.opportunity_number)
        )

        # Scenario 2: In review award recommendation with more applications
        if len(applications) > 10:
            in_progress_ar = factories.AwardRecommendationFactory.create(
                opportunity_id=competition.opportunity_id,
                award_recommendation_status=AwardRecommendationStatus.IN_REVIEW,
                award_selection_method=AwardSelectionMethod.MERIT_REVIEW_RANKING_WITH_OTHER_FACTORS,
                selection_method_detail="Using merit-based review process with three rounds",
                additional_info="Award recommendation currently being reviewed by panel.",
            )

            # Add various types of recommendations
            apps_added_to_in_progress = 0
            for i, app in enumerate(applications[10:20]):
                if not app.application_submissions:
                    continue
                apps_added_to_in_progress += 1

                if i < 5:
                    # Recommended for funding
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
                    # Recommended without funding
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
                    # Not recommended
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
                f"Created in-review AR {in_progress_ar.award_recommendation_number} with {apps_added_to_in_progress} applications"
            )

            award_recommendations_created.append(
                (in_progress_ar, "In Review", competition.opportunity.opportunity_number)
            )

        # Scenario 3: Approved award recommendation (final decisions)
        if len(applications) > 15:
            approved_ar = factories.AwardRecommendationFactory.create(
                opportunity_id=competition.opportunity_id,
                award_recommendation_status=AwardRecommendationStatus.APPROVED,
                award_selection_method=AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY,
                additional_info="Final approved recommendations ready for award issuance.",
            )

            # Add 5 applications with final decisions
            apps_added_to_approved = 0
            for i, app in enumerate(applications[15:20]):
                if not app.application_submissions:
                    continue
                apps_added_to_approved += 1

                if i < 3:
                    # Approved for funding with specific amounts
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
                    # Approved without funding
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
                    # Not recommended - final decision
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
                f"Created approved AR {approved_ar.award_recommendation_number} with {apps_added_to_approved} applications"
            )

            award_recommendations_created.append(
                (approved_ar, "Approved", competition.opportunity.opportunity_number)
            )

        # Scenario 4: Award recommendation with exception cases
        if len(applications) > 20:
            exception_ar = factories.AwardRecommendationFactory.create(
                opportunity_id=competition.opportunity_id,
                award_recommendation_status=AwardRecommendationStatus.DRAFT,
                award_selection_method=AwardSelectionMethod.SOLE_SOURCE,
                additional_info="Special circumstances require sole source selection.",
            )

            # Add application with exception
            if applications[20].application_submissions:
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

            award_recommendations_created.append(
                (exception_ar, "With Exception", competition.opportunity.opportunity_number)
            )

    # Create a static award recommendation with known ID for testing
    static_ar_id = uuid.UUID("b9c15d13-8ff1-4e15-80b8-3cf5acf84851")
    existing_static_ar = db_session.get(AwardRecommendation, static_ar_id)

    if existing_static_ar:
        logger.info(f"Static award recommendation {static_ar_id} already exists, skipping creation")
    elif competitions_with_apps:
        competition = competitions_with_apps[0]
        applications = (
            db_session.execute(
                select(Application)
                .where(
                    Application.competition_id == competition.competition_id,
                    Application.application_status == ApplicationStatus.ACCEPTED,
                )
                .limit(10)
            )
            .scalars()
            .all()
        )

        logger.info(f"Creating static AR with {len(applications)} applications")

        if applications:
            static_ar = factories.AwardRecommendationFactory.create(
                award_recommendation_id=static_ar_id,
                opportunity_id=competition.opportunity_id,
                award_recommendation_status=AwardRecommendationStatus.DRAFT,
                award_selection_method=AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY,
                additional_info="Static award recommendation for E2E testing.",
            )

            # Add multiple applications with all recommendation types well distributed
            apps_added_to_static = 0
            for i, app in enumerate(applications):
                if not app.application_submissions:
                    logger.warning(f"Application {app.application_id} has no submissions, skipping")
                    continue
                apps_added_to_static += 1

                # Ensure good distribution of all three types
                if i < 5:
                    # 5 recommended for funding with varying amounts
                    rec_type = AwardRecommendationType.RECOMMENDED_FOR_FUNDING
                    amount = 60000 - (i * 5000)  # $60k, $55k, $50k, $45k, $40k
                    comment = f"Recommended for funding - Rank #{i + 1}"
                    score = f"{90 - i * 2}"
                elif i < 7:
                    # 2 recommended without funding
                    rec_type = AwardRecommendationType.RECOMMENDED_WITHOUT_FUNDING
                    amount = 0
                    comment = "Meritorious but insufficient funds"
                    score = "75"
                else:
                    # 3 not recommended
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
                f"Created static AR {static_ar.award_recommendation_number} with {apps_added_to_static} applications"
            )

            award_recommendations_created.append(
                (static_ar, "Static (E2E)", competition.opportunity.opportunity_number)
            )
            logger.info(
                f"✓ Static award recommendation ready - http://localhost:3000/award-recommendation/{static_ar_id}/edit"
            )

    # Log summary
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
    logger.info(
        f"Creating submission detail - Type: {award_recommendation_type.name} ({award_recommendation_type.value}), "
        f"Amount: ${recommended_amount}"
    )

    detail = factories.AwardRecommendationSubmissionDetailFactory.create(
        recommended_amount=recommended_amount,
        award_recommendation_type=award_recommendation_type,
        scoring_comment=scoring_comment,
        general_comment=general_comment,
        has_exception=False,
    )

    logger.info(
        f"Detail created - ID: {detail.award_recommendation_submission_detail_id}, "
        f"Type stored: {detail.award_recommendation_type}"
    )

    factories.AwardRecommendationApplicationSubmissionFactory.create(
        award_recommendation=award_recommendation,
        application_submission=application_submission,
        award_recommendation_submission_detail=detail,
    )


def _create_competition_with_accepted_applications(db_session: db.Session) -> Competition:
    """Create a competition with many accepted applications for comprehensive testing."""
    logger.info("")
    logger.info(
        "Creating a competition with 25 accepted applications for award recommendation testing..."
    )

    # Create a competition (without instructions to avoid S3 dependency)
    competition = factories.CompetitionFactory.create(
        opportunity__opportunity_title="Award Recommendation Test Opportunity",
    )

    # Get existing organizations from database and reuse them
    from src.db.models.entity_models import Organization

    existing_orgs = db_session.execute(select(Organization).limit(25)).scalars().all()

    # Use existing orgs or create just one if none exist
    if existing_orgs:
        organizations = list(existing_orgs)
        logger.info(f"Reusing {len(organizations)} existing organizations")
    else:
        # Only create one org if absolutely necessary and reuse it
        logger.info("No existing organizations found, creating one")
        org = factories.OrganizationFactory.create()
        organizations = [org]

    # Create 25 accepted applications with variety across organizations
    for i in range(25):
        org = organizations[i % len(organizations)]  # Rotate through organizations
        app = factories.ApplicationFactory.create(
            competition=competition,
            organization=org,
            application_status=ApplicationStatus.ACCEPTED,
            application_name=f"Test Application {i + 1}",
        )

        # Create application forms
        for competition_form in competition.competition_forms[:2]:  # Add first 2 forms
            factories.ApplicationFormFactory.create(
                application=app,
                competition_form=competition_form,
                application_response={"test": "data"},
            )

        # Create application submission (skip S3 file creation)
        factories.ApplicationSubmissionFactory(
            application=app,
            file_location=f"s3://test-bucket/submissions/{app.application_id}.zip",
            file_contents="SKIP",
        )

    logger.info(f"✓ Created competition '{competition.opportunity.opportunity_title}'")
    logger.info(f"  Competition ID: {competition.competition_id}")
    logger.info(f"  Opportunity ID: {competition.opportunity_id}")
    logger.info("  Applications: 25 (all ACCEPTED status)")
    logger.info(f"  URL: http://localhost:3000/opportunity/{competition.opportunity_id}")
    logger.info("")

    return competition
