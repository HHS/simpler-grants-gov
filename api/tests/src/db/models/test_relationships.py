"""
This file tests that our relationships are setup correctly
primarily with regards to the behavior of how deletes propagate
"""

import random

import pytest
from sqlalchemy import select

from src.constants.lookup_constants import ApplicantType, FundingCategory, FundingInstrument
from src.db.models.agency_models import Agency
from src.db.models.lookup_models import LkApplicantType, LkFundingCategory, LkFundingInstrument
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    Opportunity,
    OpportunityAssistanceListing,
    OpportunityAttachment,
    OpportunitySummary,
)
from tests.src.db.models.factories import (
    AgencyFactory,
    CurrentOpportunitySummaryFactory,
    OpportunityAssistanceListingFactory,
    OpportunityAttachmentFactory,
    OpportunityFactory,
    OpportunitySummaryFactory,
)


def setup_opportunity():
    # For setting up an opportunity, we always want to create something
    # with multiple records of each type (where possible) so we can later check if those were deleted
    agency = AgencyFactory.create(agency_code=f"XYZ-ABC-{random.randint(1, 100_000_000)}")

    opportunity = OpportunityFactory.create(
        opportunity_assistance_listings=[],
        opportunity_attachments=[],
        no_current_summary=True,
        agency_code=agency.agency_code,
    )

    OpportunityAssistanceListingFactory.create_batch(size=3, opportunity=opportunity)

    OpportunityAttachmentFactory.create_batch(size=3, opportunity=opportunity)

    # Note each of these will in turn have several funding instruments, categories, and applicant types
    opportunity_summary_posted = OpportunitySummaryFactory.create(
        opportunity=opportunity, is_posted_summary=True
    )
    OpportunitySummaryFactory.create(opportunity=opportunity, is_forecasted_summary=True)

    OpportunitySummaryFactory.create(
        opportunity=opportunity, is_posted_summary=True, revision_number=1
    )
    OpportunitySummaryFactory.create(
        opportunity=opportunity, is_forecasted_summary=True, revision_number=2
    )

    CurrentOpportunitySummaryFactory.create(
        opportunity=opportunity, opportunity_summary=opportunity_summary_posted
    )

    return opportunity


def validate_db_records(
    db_session,
    opportunity: Opportunity,
    is_opportunity_deleted: bool = False,
    expected_assistance_listing_ids: list | None = None,
    expected_attachment_ids: list | None = None,
    is_current_opportunity_summary_deleted: bool = False,
    expected_opportunity_summary_ids: list | None = None,
    is_agency_deleted: bool = False,
):
    db_opportunity = (
        db_session.query(Opportunity)
        .where(Opportunity.opportunity_id == opportunity.opportunity_id)
        .one_or_none()
    )
    assert (db_opportunity is None) == is_opportunity_deleted

    db_assistance_listing_ids = (
        db_session.execute(
            select(OpportunityAssistanceListing.opportunity_assistance_listing_id).where(
                OpportunityAssistanceListing.opportunity_id == opportunity.opportunity_id
            )
        )
        .scalars()
        .all()
    )
    if expected_assistance_listing_ids is None:
        expected_assistance_listing_ids = []
    assert set(db_assistance_listing_ids) == set(expected_assistance_listing_ids)

    db_attachment_ids = (
        db_session.execute(
            select(OpportunityAttachment.attachment_id).where(
                OpportunityAttachment.opportunity_id == opportunity.opportunity_id
            )
        )
        .scalars()
        .all()
    )
    if expected_attachment_ids is None:
        expected_attachment_ids = []
    assert set(db_attachment_ids) == set(expected_attachment_ids)

    db_current_opp_summary = (
        db_session.query(CurrentOpportunitySummary)
        .where(CurrentOpportunitySummary.opportunity_id == opportunity.opportunity_id)
        .one_or_none()
    )
    assert (db_current_opp_summary is None) == is_current_opportunity_summary_deleted

    db_opportunity_summaries = (
        db_session.execute(
            select(OpportunitySummary.opportunity_summary_id).where(
                OpportunitySummary.opportunity_id == opportunity.opportunity_id
            )
        )
        .scalars()
        .all()
    )
    if expected_opportunity_summary_ids is None:
        expected_opportunity_summary_ids = []
    assert set(db_opportunity_summaries) == set(expected_opportunity_summary_ids)

    db_agency = (
        db_session.query(Agency).where(Agency.agency_code == opportunity.agency).one_or_none()
    )
    assert (db_agency is None) == is_agency_deleted


def test_delete_opportunity(db_session, enable_factory_create):
    opportunity = setup_opportunity()

    db_session.delete(opportunity)
    db_session.commit()
    db_session.expunge_all()

    validate_db_records(
        db_session,
        opportunity,
        is_opportunity_deleted=True,
        expected_assistance_listing_ids=[],
        expected_attachment_ids=[],
        is_current_opportunity_summary_deleted=True,
        expected_opportunity_summary_ids=[],
        is_agency_deleted=False,
    )


def test_delete_opportunity_summary_is_current(db_session, enable_factory_create):
    opportunity = setup_opportunity()
    summary = opportunity.current_opportunity_summary.opportunity_summary
    assistance_listings = opportunity.opportunity_assistance_listings
    opportunity_summaries = opportunity.all_opportunity_summaries
    attachments = opportunity.opportunity_attachments

    db_session.delete(summary)
    db_session.commit()
    db_session.expunge_all()

    validate_db_records(
        db_session,
        opportunity,
        is_opportunity_deleted=False,
        expected_assistance_listing_ids=[
            a.opportunity_assistance_listing_id for a in assistance_listings
        ],
        expected_attachment_ids=[a.attachment_id for a in attachments],
        is_current_opportunity_summary_deleted=True,
        expected_opportunity_summary_ids=[
            o.opportunity_summary_id
            for o in opportunity_summaries
            if o.opportunity_summary_id != summary.opportunity_summary_id
        ],
        is_agency_deleted=False,
    )


def test_delete_opportunity_summary_is_not_current(db_session, enable_factory_create):
    opportunity = setup_opportunity()
    assistance_listings = opportunity.opportunity_assistance_listings
    opportunity_summaries = opportunity.all_opportunity_summaries
    attachments = opportunity.opportunity_attachments

    # Make the summary we delete be the non-current one
    summary = None
    for opportunity_summary in opportunity_summaries:
        if (
            opportunity_summary.opportunity_summary_id
            != opportunity.current_opportunity_summary.opportunity_summary_id
        ):
            summary = opportunity_summary
            break

    db_session.delete(summary)
    db_session.commit()
    db_session.expunge_all()

    validate_db_records(
        db_session,
        opportunity,
        is_opportunity_deleted=False,
        expected_assistance_listing_ids=[
            a.opportunity_assistance_listing_id for a in assistance_listings
        ],
        expected_attachment_ids=[a.attachment_id for a in attachments],
        is_current_opportunity_summary_deleted=False,
        expected_opportunity_summary_ids=[
            o.opportunity_summary_id
            for o in opportunity_summaries
            if o.opportunity_summary_id != summary.opportunity_summary_id
        ],
        is_agency_deleted=False,
    )


def test_delete_current_opportunity_summary(db_session, enable_factory_create):
    opportunity = setup_opportunity()
    assistance_listings = opportunity.opportunity_assistance_listings
    opportunity_summaries = opportunity.all_opportunity_summaries
    attachments = opportunity.opportunity_attachments

    db_session.delete(opportunity.current_opportunity_summary)
    db_session.commit()
    db_session.expunge_all()

    # Deleting the current_opportunity_summary record should not delete
    # anything else as it's just a useful linkage between opportunity and opportunity_summary
    validate_db_records(
        db_session,
        opportunity,
        is_opportunity_deleted=False,
        expected_assistance_listing_ids=[
            a.opportunity_assistance_listing_id for a in assistance_listings
        ],
        expected_attachment_ids=[a.attachment_id for a in attachments],
        is_current_opportunity_summary_deleted=True,
        expected_opportunity_summary_ids=[o.opportunity_summary_id for o in opportunity_summaries],
        is_agency_deleted=False,
    )


def test_delete_opportunity_assistance_listing(db_session, enable_factory_create):
    opportunity = setup_opportunity()
    assistance_listings = opportunity.opportunity_assistance_listings
    assistance_listing_to_delete = assistance_listings[-1]
    opportunity_summaries = opportunity.all_opportunity_summaries
    attachments = opportunity.opportunity_attachments

    db_session.delete(assistance_listing_to_delete)
    db_session.commit()
    db_session.expunge_all()

    validate_db_records(
        db_session,
        opportunity,
        is_opportunity_deleted=False,
        expected_assistance_listing_ids=[
            a.opportunity_assistance_listing_id
            for a in assistance_listings
            if a.opportunity_assistance_listing_id
            != assistance_listing_to_delete.opportunity_assistance_listing_id
        ],
        expected_attachment_ids=[a.attachment_id for a in attachments],
        is_current_opportunity_summary_deleted=False,
        expected_opportunity_summary_ids=[o.opportunity_summary_id for o in opportunity_summaries],
        is_agency_deleted=False,
    )


def test_delete_attachments(db_session, enable_factory_create):
    opportunity = setup_opportunity()
    assistance_listings = opportunity.opportunity_assistance_listings
    opportunity_summaries = opportunity.all_opportunity_summaries
    attachments = opportunity.opportunity_attachments

    attachment_to_delete = attachments[-1]

    db_session.delete(attachment_to_delete)
    db_session.commit()
    db_session.expunge_all()

    validate_db_records(
        db_session,
        opportunity,
        is_opportunity_deleted=False,
        expected_assistance_listing_ids=[
            a.opportunity_assistance_listing_id for a in assistance_listings
        ],
        expected_attachment_ids=[
            a.attachment_id
            for a in attachments
            if a.attachment_id != attachment_to_delete.attachment_id
        ],
        is_current_opportunity_summary_deleted=False,
        expected_opportunity_summary_ids=[o.opportunity_summary_id for o in opportunity_summaries],
        is_agency_deleted=False,
    )


def test_delete_agency(db_session, enable_factory_create):
    opportunity = setup_opportunity()
    agency = opportunity.agency_record
    assistance_listings = opportunity.opportunity_assistance_listings
    opportunity_summaries = opportunity.all_opportunity_summaries
    attachments = opportunity.opportunity_attachments

    db_session.delete(agency)
    db_session.commit()
    db_session.expunge_all()

    # Deleting the agency should not affect the opportunity
    validate_db_records(
        db_session,
        opportunity,
        is_opportunity_deleted=False,
        expected_assistance_listing_ids=[
            a.opportunity_assistance_listing_id for a in assistance_listings
        ],
        expected_attachment_ids=[a.attachment_id for a in attachments],
        is_current_opportunity_summary_deleted=False,
        expected_opportunity_summary_ids=[o.opportunity_summary_id for o in opportunity_summaries],
        is_agency_deleted=True,
    )


def test_delete_link_values(db_session, enable_factory_create):
    opportunity = setup_opportunity()
    assistance_listings = opportunity.opportunity_assistance_listings
    opportunity_summaries = opportunity.all_opportunity_summaries
    attachments = opportunity.opportunity_attachments

    summary = opportunity.current_opportunity_summary.opportunity_summary
    funding_category_to_delete = summary.link_funding_categories[-1]
    funding_instrument_to_delete = summary.link_funding_instruments[0]
    applicant_type_to_delete = summary.link_applicant_types[-1]

    db_session.delete(funding_category_to_delete)
    db_session.delete(funding_instrument_to_delete)
    db_session.delete(applicant_type_to_delete)
    db_session.commit()
    db_session.expunge_all()

    validate_db_records(
        db_session,
        opportunity,
        is_opportunity_deleted=False,
        expected_assistance_listing_ids=[
            a.opportunity_assistance_listing_id for a in assistance_listings
        ],
        expected_attachment_ids=[a.attachment_id for a in attachments],
        is_current_opportunity_summary_deleted=False,
        expected_opportunity_summary_ids=[o.opportunity_summary_id for o in opportunity_summaries],
        is_agency_deleted=False,
    )

    # Additional sanity test that the relationship to the lookup tables didn't cause any sort of deletes
    funding_categories = db_session.query(LkFundingCategory).all()
    assert len(funding_categories) == len([f for f in FundingCategory])

    funding_instruments = db_session.query(LkFundingInstrument).all()
    assert len(funding_instruments) == len([f for f in FundingInstrument])

    applicant_types = db_session.query(LkApplicantType).all()
    assert len(applicant_types) == len([a for a in ApplicantType])


def test_delete_child_agency(db_session, enable_factory_create):
    parent_agency = AgencyFactory.create(agency_code=f"TOP{random.randint(1, 100_000_000)}")
    child_agency = AgencyFactory.create(
        agency_code=parent_agency.agency_code + "-xyz", top_level_agency=parent_agency
    )

    db_session.delete(child_agency)
    db_session.commit()
    db_session.expunge_all()

    # Deleting the child should not affect the parent
    db_agency = (
        db_session.query(Agency).filter(Agency.agency_id == parent_agency.agency_id).one_or_none()
    )
    assert db_agency is not None


def test_delete_parent_agency(db_session, enable_factory_create):
    parent_agency = AgencyFactory.create(agency_code=f"TOP{random.randint(1, 100_000_000)}")
    AgencyFactory.create(
        agency_code=parent_agency.agency_code + "-xyz", top_level_agency=parent_agency
    )

    # Trying to delete the parent will give a foreign key constraint error, we don't
    # have the relationships setup in a way that would support this right now
    with pytest.raises(Exception, match="violates foreign key constraint"):
        db_session.delete(parent_agency)
        db_session.commit()
        db_session.expunge_all()
