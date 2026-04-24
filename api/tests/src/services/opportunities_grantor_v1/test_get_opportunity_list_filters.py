import uuid
from datetime import datetime, timedelta
from unittest.mock import MagicMock

import pytest
from sqlalchemy import select

from src.constants.lookup_constants import OpportunityStatus, Privilege
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import CurrentOpportunitySummary, Opportunity, OpportunitySummary
from src.db.models.user_models import User
from src.services.opportunities_grantor_v1.get_opportunity_list import (
    ListOpportunitiesParams, 
    OpportunityFilterSchema, 
    get_opportunity_list_for_grantors
)


@pytest.fixture
def mock_user():
    user = MagicMock(spec=User)
    user.user_id = uuid.uuid4()
    return user


@pytest.fixture
def mock_agency():
    agency = MagicMock(spec=Agency)
    agency.agency_id = uuid.uuid4()
    agency.agency_code = "TEST"
    agency.agency_name = "Test Agency"
    return agency


@pytest.fixture
def mock_opportunity(mock_agency):
    opportunity = MagicMock(spec=Opportunity)
    opportunity.opportunity_id = uuid.uuid4()
    opportunity.agency_id = mock_agency.agency_id
    opportunity.agency_record = mock_agency
    opportunity.opportunity_number = "TEST-001"
    opportunity.opportunity_title = "Test Opportunity"
    opportunity.is_draft = False
    opportunity.created_at = datetime.now() - timedelta(days=30)
    return opportunity


@pytest.fixture
def mock_opportunity_draft(mock_agency):
    opportunity = MagicMock(spec=Opportunity)
    opportunity.opportunity_id = uuid.uuid4()
    opportunity.agency_id = mock_agency.agency_id
    opportunity.agency_record = mock_agency
    opportunity.opportunity_number = "TEST-002"
    opportunity.opportunity_title = "Draft Opportunity"
    opportunity.is_draft = True
    opportunity.created_at = datetime.now() - timedelta(days=15)
    return opportunity


@pytest.fixture
def mock_current_summary():
    current_summary = MagicMock(spec=CurrentOpportunitySummary)
    current_summary.opportunity_status = OpportunityStatus.POSTED
    return current_summary


@pytest.fixture
def mock_db_session(mock_opportunity, mock_opportunity_draft, mock_current_summary):
    db_session = MagicMock()
    
    # Set up opportunity with current summary relationship
    mock_opportunity.current_opportunity_summary = mock_current_summary
    mock_opportunity_draft.current_opportunity_summary = None
    
    # Configure session execute to return opportunities
    def mock_execute(stmt):
        result = MagicMock()
        if isinstance(stmt, select):
            if hasattr(stmt, '_where_criteria') and stmt._where_criteria:
                # Check filter conditions
                if any("is_draft" in str(c) and "false" in str(c).lower() for c in stmt._where_criteria):
                    result.scalars.return_value.all.return_value = [mock_opportunity]
                elif any("is_draft" in str(c) and "true" in str(c).lower() for c in stmt._where_criteria):
                    result.scalars.return_value.all.return_value = [mock_opportunity_draft]
                else:
                    result.scalars.return_value.all.return_value = [mock_opportunity, mock_opportunity_draft]
            else:
                result.scalars.return_value.all.return_value = [mock_opportunity, mock_opportunity_draft]
        return result
    
    db_session.execute = mock_execute
    db_session.query.return_value.filter.return_value.first.return_value = mock_opportunity.agency_record
    
    return db_session


def test_get_opportunity_list_no_filters(mock_db_session, mock_user, mock_agency):
    """Test getting opportunities without any filters."""
    from src.auth.endpoint_access_util import verify_access as mock_verify_access
    mock_verify_access.return_value = None
    
    params = {"pagination": {"page_offset": 1, "page_size": 10, "sort_order": []}}
    
    opportunities, _ = get_opportunity_list_for_grantors(
        mock_db_session, mock_user, mock_agency.agency_id, params
    )
    
    # Should return both opportunities (draft and non-draft)
    assert len(opportunities) == 2


def test_get_opportunity_list_draft_filter(mock_db_session, mock_user, mock_agency):
    """Test filtering opportunities by draft status."""
    from src.auth.endpoint_access_util import verify_access as mock_verify_access
    mock_verify_access.return_value = None
    
    # Test filtering for non-draft opportunities
    params = {
        "pagination": {"page_offset": 1, "page_size": 10, "sort_order": []},
        "filters": {"draft_status": False}
    }
    
    opportunities, _ = get_opportunity_list_for_grantors(
        mock_db_session, mock_user, mock_agency.agency_id, params
    )
    
    # Should return only non-draft opportunities
    assert len(opportunities) == 1
    assert opportunities[0].is_draft is False
    
    # Test filtering for draft opportunities
    params["filters"]["draft_status"] = True
    
    opportunities, _ = get_opportunity_list_for_grantors(
        mock_db_session, mock_user, mock_agency.agency_id, params
    )
    
    # Should return only draft opportunities
    assert len(opportunities) == 1
    assert opportunities[0].is_draft is True


def test_get_opportunity_list_award_recommendation_ready(mock_db_session, mock_user, mock_agency):
    """Test filtering opportunities by award recommendation readiness."""
    from src.auth.endpoint_access_util import verify_access as mock_verify_access
    mock_verify_access.return_value = None
    
    params = {
        "pagination": {"page_offset": 1, "page_size": 10, "sort_order": []},
        "filters": {"award_recommendation_ready": True}
    }
    
    opportunities, _ = get_opportunity_list_for_grantors(
        mock_db_session, mock_user, mock_agency.agency_id, params
    )
    
    # Should return only non-draft opportunities with valid status
    assert len(opportunities) == 1
    assert opportunities[0].is_draft is False
    assert opportunities[0].current_opportunity_summary.opportunity_status == OpportunityStatus.POSTED
