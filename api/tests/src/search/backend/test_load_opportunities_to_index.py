
import pytest

from src.search.backend.load_opportunities_to_index import (
    LoadOpportunitiesToIndex,
    LoadOpportunitiesToIndexConfig,
)
from src.util import file_util
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import (
    AgencyFactory,
    ExcludedOpportunityReviewFactory,
    OpportunityAttachmentFactory,
    OpportunityChangeAuditFactory,
    OpportunityFactory,
)


class TestLoadOpportunitiesToIndexFullRefresh(BaseTestClass):
    @pytest.fixture(scope="class")
    def load_opportunities_to_index(self, db_session, search_client, opportunity_index_alias):
        config = LoadOpportunitiesToIndexConfig(
            alias_name=opportunity_index_alias,
            index_prefix="test-load-opps",
        )
        return LoadOpportunitiesToIndex(db_session, search_client, True, config)

    def test_load_opportunities_to_index(
        self,
        truncate_opportunities,
        enable_factory_create,
        search_client,
        opportunity_index_alias,
        load_opportunities_to_index,
    ):
        # Create an agency that some records will be connected to
        agency = AgencyFactory.create(agency_code="FUN-AGENCY", is_test_agency=False)

        # Create 25 opportunities we will load into the search index
        opportunities = []
        opportunities.extend(
            OpportunityFactory.create_batch(
                size=6,
                is_posted_summary=True,
                agency_code=agency.agency_code,
                opportunity_attachments=[],
            )
        )
        opportunities.extend(
            OpportunityFactory.create_batch(
                size=3, is_forecasted_summary=True, opportunity_attachments=[]
            )
        )
        opportunities.extend(
            OpportunityFactory.create_batch(
                size=2, is_closed_summary=True, opportunity_attachments=[]
            )
        )
        opportunities.extend(
            OpportunityFactory.create_batch(
                size=8, is_archived_non_forecast_summary=True, opportunity_attachments=[]
            )
        )
        opportunities.extend(
            OpportunityFactory.create_batch(
                size=6,
                is_archived_forecast_summary=True,
                agency_code=agency.agency_code,
                opportunity_attachments=[],
            )
        )

        # Create some opportunities that won't get fetched / loaded into search
        OpportunityFactory.create_batch(size=3, is_draft=True, opportunity_attachments=[])
        OpportunityFactory.create_batch(size=4, no_current_summary=True, opportunity_attachments=[])

        AgencyFactory.create(agency_code="MY-TEST-AGENCY", is_test_agency=True)
        OpportunityFactory.create_batch(
            size=3, agency_code="MY-TEST-AGENCY", opportunity_attachments=[]
        )

        for opportunity in opportunities:
            OpportunityChangeAuditFactory.create(
                opportunity=opportunity,
            )

        load_opportunities_to_index.run()
        # Verify some metrics first
        assert (
            len(opportunities)
            == load_opportunities_to_index.metrics[
                load_opportunities_to_index.Metrics.RECORDS_LOADED
            ]
        )

        # Just do some rough validation that the data is present
        resp = search_client.search(opportunity_index_alias, {"size": 100})

        assert resp.total_records == len(opportunities)

        assert set([str(opp.opportunity_id) for opp in opportunities]) == set(
            [record["opportunity_id"] for record in resp.records]
        )

        # Rerunning without changing anything about the data in the DB doesn't meaningfully change anything
        load_opportunities_to_index.index_name = load_opportunities_to_index.index_name + "-another"
        load_opportunities_to_index.run()
        resp = search_client.search(opportunity_index_alias, {"size": 100})

        assert resp.total_records == len(opportunities)

        assert set([str(opp.opportunity_id) for opp in opportunities]) == set(
            [record["opportunity_id"] for record in resp.records]
        )

        assert load_opportunities_to_index.metrics[
            load_opportunities_to_index.Metrics.RECORDS_LOADED
        ] == len(opportunities)
        assert (
            load_opportunities_to_index.metrics[
                load_opportunities_to_index.Metrics.TEST_RECORDS_SKIPPED
            ]
            == 3
        )

        # Rerunning but first add a few more opportunities to show up
        opportunities.extend(OpportunityFactory.create_batch(size=3, opportunity_attachments=[]))
        load_opportunities_to_index.index_name = (
            load_opportunities_to_index.index_name + "-new-data"
        )
        load_opportunities_to_index.run()

        resp = search_client.search(opportunity_index_alias, {"size": 100})

        assert resp.total_records == len(opportunities)

        assert set([str(opp.opportunity_id) for opp in opportunities]) == set(
            [record["opportunity_id"] for record in resp.records]
        )

    def test_opportunity_attachment_pipeline(
        self,
        mock_s3_bucket,
        db_session,
        enable_factory_create,
        load_opportunities_to_index,
        monkeypatch: pytest.MonkeyPatch,
        opportunity_index_alias,
        search_client,
    ):
        filename_1 = "test_file_1.txt"
        file_path_1 = f"s3://{mock_s3_bucket}/{filename_1}"
        content = "I am a file"

        with file_util.open_stream(file_path_1, "w") as outfile:
            outfile.write(content)

        filename_2 = "test_file_2.css"
        file_path_2 = f"s3://{mock_s3_bucket}/{filename_2}"

        opportunity = OpportunityFactory.create(opportunity_attachments=[])
        OpportunityAttachmentFactory.create(
            opportunity=opportunity,
            file_contents=content,
            file_location=file_path_1,
            file_name=filename_1,
        )

        OpportunityAttachmentFactory.create(
            opportunity=opportunity,
            file_contents=content,
            file_location=file_path_2,
            file_name=filename_2,
        )

        load_opportunities_to_index.index_name = (
            load_opportunities_to_index.index_name + "-pipeline"
        )

        load_opportunities_to_index.run()

        resp = search_client.search(opportunity_index_alias, {"size": 100})

        record = [
            d for d in resp.records if d.get("opportunity_id") == str(opportunity.opportunity_id)
        ]
        attachments = record[0]["attachments"]

        expected_number_of_processed_attachments = 1
        expected_number_of_skipped_attachments = 1
        expected_number_of_failed_attachments = 0

        # assert only one (allowed) opportunity attachment was uploaded
        assert len(attachments) == expected_number_of_processed_attachments

        # assert processed attachment metrics
        assert (
            load_opportunities_to_index.metrics[
                load_opportunities_to_index.Metrics.ATTACHMENTS_PROCESSED
            ]
            == expected_number_of_processed_attachments
        )
        assert (
            load_opportunities_to_index.metrics[
                load_opportunities_to_index.Metrics.ATTACHMENTS_SKIPPED
            ]
            == expected_number_of_skipped_attachments
        )
        assert (
            load_opportunities_to_index.metrics[
                load_opportunities_to_index.Metrics.ATTACHMENTS_FAILED
            ]
            == expected_number_of_failed_attachments
        )

        # assert correct attachment was uploaded
        assert attachments[0]["filename"] == filename_1
        # assert data was b64encoded
        assert attachments[0]["attachment"]["content"] == content  # decoded b64encoded attachment

    def test_excluded_opportunities_not_indexed(
        self,
        db_session,
        enable_factory_create,
        search_client,
        opportunity_index_alias,
        load_opportunities_to_index,
    ):

        # Create opportunities that should be indexed (not excluded)
        included_opportunities = OpportunityFactory.create_batch(
            size=3, is_posted_summary=True, opportunity_attachments=[]
        )

        # Create opportunities that should be excluded from indexing
        excluded_opportunities = OpportunityFactory.create_batch(
            size=2, is_posted_summary=True, opportunity_attachments=[]
        )

        # Add the excluded opportunities to the ExcludedOpportunityReview table
        for opportunity in excluded_opportunities:
            ExcludedOpportunityReviewFactory.create(
                legacy_opportunity_id=opportunity.legacy_opportunity_id
            )

        # Ensure we have a unique index name for this test to avoid conflicts
        load_opportunities_to_index.index_name = (
            load_opportunities_to_index.index_name + "-excluded-test"
        )

        # Run the indexing process
        load_opportunities_to_index.run()

        # Get all indexed opportunities from the search index
        resp = search_client.search(opportunity_index_alias, {"size": 100})
        all_indexed_opportunity_ids = set([record["opportunity_id"] for record in resp.records])

        # Convert our test opportunities to string IDs for comparison
        expected_included_ids = set([str(opp.opportunity_id) for opp in included_opportunities])
        expected_excluded_ids = set([str(opp.opportunity_id) for opp in excluded_opportunities])

        # Verify that ALL of our expected opportunities are present in the index
        missing_included = expected_included_ids - all_indexed_opportunity_ids
        assert (
            not missing_included
        ), f"Expected opportunities missing from index: {missing_included}"

        # Verify that NONE of our excluded opportunities are present in the index
        incorrectly_included = expected_excluded_ids & all_indexed_opportunity_ids
        assert (
            not incorrectly_included
        ), f"Excluded opportunities found in index: {incorrectly_included}"

        # Additional verification: ensure the sets are disjoint (no overlap)
        assert expected_included_ids.isdisjoint(
            expected_excluded_ids
        ), "Test setup error: included and excluded sets overlap"
