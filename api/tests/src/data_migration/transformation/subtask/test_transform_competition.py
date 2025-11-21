import pytest

import src.data_migration.transformation.transform_constants as transform_constants
import tests.src.db.models.factories as f
from src.constants.lookup_constants import CompetitionOpenToApplicant, FormFamily
from src.data_migration.transformation.subtask.transform_competition import (
    TransformCompetition,
    transform_form_family,
    transform_open_to_applicants,
)
from src.db.models.competition_models import Competition
from src.db.models.opportunity_models import Opportunity, OpportunityAssistanceListing
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.data_migration.transformation.conftest import (
    BaseTransformTestClass,
    setup_competition,
    validate_competition,
)


class TestTransformCompetition(BaseTransformTestClass):
    @pytest.fixture(autouse=True)
    def cleanup_competitions(self, db_session, test_staging_schema):
        """Clean up competition data before each test."""
        # Use cascade delete to properly handle foreign key constraints
        cascade_delete_from_db_table(db_session, Competition)

        # Clean opportunity tables
        cascade_delete_from_db_table(db_session, OpportunityAssistanceListing)
        cascade_delete_from_db_table(db_session, Opportunity)

        db_session.commit()

    @pytest.fixture
    def transform_competition(self, transform_oracle_data_task):
        return TransformCompetition(transform_oracle_data_task)

    def test_process_competitions(self, db_session, transform_competition):
        """Test the normal path for processing competitions"""
        # Create an opportunity to associate with the competitions
        opportunity = f.OpportunityFactory.create(opportunity_assistance_listings=[])
        opportunity_assistance_listing = f.OpportunityAssistanceListingFactory.create(
            opportunity=opportunity
        )
        f.StagingTopportunityCfdaFactory.create(
            opp_cfda_id=opportunity_assistance_listing.legacy_opportunity_assistance_listing_id,
            opportunity_id=opportunity.legacy_opportunity_id,
            opportunity=None,  # Prevent factory from creating another opportunity
        )

        # Test insertions
        basic_insert = setup_competition(
            db_session,
            create_existing=False,
            opportunity=opportunity,
            legacy_opportunity_assistance_listing_id=opportunity_assistance_listing.legacy_opportunity_assistance_listing_id,
        )

        # Insert with null fields (for optional fields only)
        insert_with_null_fields = setup_competition(
            db_session,
            create_existing=False,
            opportunity=opportunity,
            source_values={
                "familyid": None,
                "opentoapplicanttype": None,
                "electronic_required": None,
                "ismulti": None,
                "sendmail": None,
                # is_wrkspc_compatible must have a value (cannot be None)
                "is_wrkspc_compatible": "Y",
            },
        )

        # Test updates
        basic_update = setup_competition(
            db_session,
            create_existing=True,
            opportunity=opportunity,
            source_values={
                "competitiontitle": "Updated Competition Title",
                "graceperiod": 20,
                # Test changing is_wrkspc_compatible value
                "is_wrkspc_compatible": "N",
                "expected_appl_num": 4356435643,
            },
        )

        # Test delete
        basic_delete = setup_competition(
            db_session, create_existing=True, is_delete=True, opportunity=opportunity
        )

        # Test case where cfda listing exists in staging but not api schema
        # and we are still able to associate competition to oppportunity.
        cfda_opp_id_in_staging_only = 10111
        cfda_opp_listing_only_in_staging = setup_competition(
            db_session,
            create_existing=False,
            opportunity=opportunity,
            legacy_opportunity_assistance_listing_id=cfda_opp_id_in_staging_only,
        )

        # Test case where opportunity_id found through cfda listing but the opportunity
        # does not exist for that id.
        non_existent_opportunity_cfda_listing_opp_cfda_id = 123456
        non_existent_opportunity_id = 19929292
        f.StagingTopportunityCfdaFactory.create(
            opp_cfda_id=non_existent_opportunity_cfda_listing_opp_cfda_id,
            opportunity_id=non_existent_opportunity_id,
            opportunity=None,
        )
        competition_with_no_opportunity = setup_competition(
            db_session,
            create_existing=False,
            opportunity=None,
            legacy_opportunity_assistance_listing_id=non_existent_opportunity_cfda_listing_opp_cfda_id,
        )

        # Run the transformation
        transform_competition.run_subtask()

        # Validate the results
        validate_competition(
            db_session, cfda_opp_listing_only_in_staging, expect_assistance_listing=False
        )
        validate_competition(
            db_session,
            competition_with_no_opportunity,
            expect_assistance_listing=False,
            expect_in_db=False,
        )
        validate_competition(db_session, basic_insert)
        validate_competition(db_session, insert_with_null_fields)
        validate_competition(db_session, basic_update)
        validate_competition(db_session, basic_delete, expect_in_db=False)

        # Check the metrics
        metrics = transform_competition.metrics
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 6
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 3
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 1
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 1
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_ORPHANED] == 1
        assert transform_constants.Metrics.TOTAL_ERROR_COUNT not in metrics

    def test_form_family_mapping(self):
        """Test the form family mapping function"""
        assert transform_form_family(12) == FormFamily.SF_424_INDIVIDUAL
        assert transform_form_family(14) == FormFamily.RR
        assert transform_form_family(15) == FormFamily.SF_424
        assert transform_form_family(16) == FormFamily.SF_424_MANDATORY
        assert transform_form_family(17) == FormFamily.SF_424_SHORT_ORGANIZATION
        assert transform_form_family(None) is None

        # Test invalid value
        with pytest.raises(ValueError, match="Unknown form family ID: 999"):
            transform_form_family(999)

    def test_open_to_applicants_mapping(self):
        """Test the open to applicants mapping function"""
        # Test individual applicant type
        individual_set = transform_open_to_applicants(2)
        assert len(individual_set) == 1
        assert CompetitionOpenToApplicant.INDIVIDUAL in individual_set

        # Test organization applicant type
        organization_set = transform_open_to_applicants(1)
        assert len(organization_set) == 1
        assert CompetitionOpenToApplicant.ORGANIZATION in organization_set

        # Test both types
        both_set = transform_open_to_applicants(3)
        assert len(both_set) == 2
        assert CompetitionOpenToApplicant.INDIVIDUAL in both_set
        assert CompetitionOpenToApplicant.ORGANIZATION in both_set

        # Test null
        assert transform_open_to_applicants(None) == set()

        # Test invalid value
        with pytest.raises(ValueError, match="Unknown open to applicant type: 999"):
            transform_open_to_applicants(999)

    def test_process_competition_with_invalid_form_family(self, db_session, transform_competition):
        """Test handling invalid form family ID"""
        # Create an opportunity to associate with the competition
        opportunity = f.OpportunityFactory.create(opportunity_assistance_listings=[])
        opportunity_assistance_listing = f.OpportunityAssistanceListingFactory.create(
            opportunity=opportunity,
        )
        db_session.commit()

        # Create competition with valid opportunity but invalid form family
        competition = setup_competition(
            db_session,
            create_existing=False,
            opportunity=opportunity,
            source_values={
                "familyid": 999,  # Invalid form family ID
                "opp_cfda_id": opportunity_assistance_listing.legacy_opportunity_assistance_listing_id,
                "comp_id": 90001,  # Unique ID for this test
            },
        )
        db_session.commit()

        # Should raise a ValueError
        with pytest.raises(ValueError, match="Unknown form family ID: 999"):
            transform_competition.process_competition(
                competition,
                None,
                opportunity.opportunity_id,
                opportunity_assistance_listing.opportunity_assistance_listing_id,
            )

    def test_process_competition_with_invalid_applicant_type(
        self, db_session, transform_competition
    ):
        """Test handling invalid applicant type"""
        # Create an opportunity to associate with the competition
        opportunity = f.OpportunityFactory.create(opportunity_assistance_listings=[])
        opportunity_assistance_listing = f.OpportunityAssistanceListingFactory.create(
            opportunity=opportunity,
        )
        db_session.commit()

        # Create competition with valid opportunity but invalid applicant type
        competition = setup_competition(
            db_session,
            create_existing=False,
            opportunity=opportunity,
            source_values={
                "opentoapplicanttype": 999,  # Invalid applicant type
                "opp_cfda_id": opportunity_assistance_listing.opportunity_assistance_listing_id,
                "comp_id": 90002,  # Unique ID for this test
            },
        )
        db_session.commit()

        # Should raise a ValueError
        with pytest.raises(ValueError, match="Unknown open to applicant type: 999"):
            transform_competition.process_competition(
                competition,
                None,
                opportunity.opportunity_id,
                opportunity_assistance_listing.opportunity_assistance_listing_id,
            )
