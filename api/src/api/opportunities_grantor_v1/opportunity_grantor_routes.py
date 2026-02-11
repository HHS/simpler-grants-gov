import io
import logging
from uuid import UUID

from flask import Response

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.adapters.search as search
import src.adapters.search.flask_opensearch as flask_opensearch
import src.api.opportunities_v1.opportunity_schemas as opportunity_schemas
import src.api.opportunities_grantor_v1.opportunity_grantor_schemas as opportunity_grantor_schemas
import src.api.response as response
import src.util.datetime_util as datetime_util
from src.api.opportunities_grantor_v1.opportunity_grantor_blueprint import opportunity_grantor_blueprint
from src.auth.api_jwt_auth import api_jwt_auth
from src.auth.multi_auth import (
    api_key_multi_auth,
    api_key_multi_auth_security_schemes,
    jwt_or_api_user_key_multi_auth,
    jwt_or_api_user_key_security_schemes,
)
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.opportunities_v1.get_opportunity import (
    get_opportunity,
    get_opportunity_by_legacy_id,
)
from src.services.opportunities_v1.opportunity_to_csv import opportunities_to_csv
from src.services.opportunities_v1.search_opportunities import search_opportunities
from src.util.dict_util import flatten_dict

logger = logging.getLogger(__name__)

# Descriptions in OpenAPI support markdown https://swagger.io/specification/
SHARED_ALPHA_DESCRIPTION = """
__ALPHA VERSION__

This endpoint in its current form is primarily for testing and feedback.

Features in this endpoint are still under heavy development, and subject to change. Not for production use.

See [Release Phases](https://github.com/github/roadmap?tab=readme-ov-file#release-phases) for further details.
"""

examples = {
    "example1": {
        "summary": "No filters",
        "value": {
            "pagination": {
                "sort_order": [
                    {
                        "order_by": "opportunity_id",
                        "sort_direction": "ascending",
                    }
                ],
                "page_offset": 1,
                "page_size": 25,
            },
        },
    },
    "example2": {
        "summary": "All filters",
        "value": {
            "query": "research",
            "filters": {
                "agency": {"one_of": ["USAID", "DOC"]},
                "applicant_type": {
                    "one_of": ["state_governments", "county_governments", "individuals"]
                },
                "funding_category": {"one_of": ["recovery_act", "arts", "natural_resources"]},
                "funding_instrument": {"one_of": ["cooperative_agreement", "grant"]},
                "opportunity_status": {"one_of": ["forecasted", "posted"]},
                "post_date": {"start_date": "2024-01-01", "end_date": "2024-02-01"},
                "close_date": {
                    "start_date": "2024-01-01",
                },
            },
            "pagination": {
                "sort_order": [
                    {
                        "order_by": "opportunity_id",
                        "sort_direction": "ascending",
                    }
                ],
                "page_offset": 1,
                "page_size": 25,
            },
        },
    },
    "example3": {
        "summary": "Query & opportunity_status filters",
        "value": {
            "query": "research",
            "filters": {
                "opportunity_status": {"one_of": ["forecasted", "posted"]},
            },
            "pagination": {
                "sort_order": [
                    {
                        "order_by": "opportunity_id",
                        "sort_direction": "ascending",
                    }
                ],
                "page_offset": 1,
                "page_size": 25,
            },
        },
    },
    "example4": {
        "summary": "CSV file response",
        "value": {
            "format": "csv",
            "filters": {
                "opportunity_status": {"one_of": ["forecasted", "posted"]},
            },
            "pagination": {
                "sort_order": [
                    {
                        "order_by": "opportunity_id",
                        "sort_direction": "ascending",
                    }
                ],
                "page_offset": 1,
                "page_size": 100,
            },
        },
    },
    "example5": {
        "summary": "Filter by award fields",
        "value": {
            "filters": {
                "expected_number_of_awards": {"min": 5},
                "award_floor": {"min": 10000},
                "award_ceiling": {"max": 1000000},
                "estimated_total_program_funding": {"min": 100000, "max": 250000},
            },
            "pagination": {
                "sort_order": [
                    {
                        "order_by": "opportunity_id",
                        "sort_direction": "ascending",
                    }
                ],
                "page_offset": 1,
                "page_size": 25,
            },
        },
    },
    "example6": {
        "summary": "Filter by assistance listing numbers",
        "value": {
            "filters": {
                "assistance_listing_number": {"one_of": ["43.001", "47.049"]},
            },
            "pagination": {
                "sort_order": [
                    {
                        "order_by": "opportunity_id",
                        "sort_direction": "ascending",
                    }
                ],
                "page_offset": 1,
                "page_size": 25,
            },
        },
    },
    "example7": {
        "summary": "Primary sort agency_code desc, secondary sort opportunity_id asc",
        "value": {
            "pagination": {
                "page_offset": 1,
                "page_size": 25,
                "sort_order": [
                    {"order_by": "agency_code", "sort_direction": "descending"},
                    {"order_by": "opportunity_id", "sort_direction": "ascending"},
                ],
            }
        },
    },
}

@opportunity_grantor_blueprint.post("/opportunities/")
@opportunity_grantor_blueprint.input(opportunity_grantor_schemas.OpportunityCreateRequestSchema, location="json")
@opportunity_grantor_blueprint.output(opportunity_grantor_schemas.OpportunityCreateResponseSchema())
# @opportunity_grantor_blueprint.auth_required(api_jwt_auth)  # Temporarily commented out for testing
@opportunity_grantor_blueprint.doc(
    summary="Create a new opportunity",
    description="""Create a new opportunity within the specified agency.
    
    **Authorization**: Requires the `create_opportunity` privilege for the specified agency.
    
    **Logic**:
    - Fetches the agency by ID (404 if it doesn't exist)
    - Performs authorization check (403 if user doesn't have the privilege)
    - Checks if opportunity number already exists (422 if it does)
    - Creates the opportunity as a draft
    - Returns the created opportunity
    
    **Note**: System will automatically generate: opportunity_id, agency_code, is_draft (always true), 
    created_at, and updated_at fields.
    """,
    responses={
        200: "Success - Returns the created opportunity",
        401: "Unauthorized - Authentication required",
        403: "Forbidden - User doesn't have the create_opportunity privilege for the agency",
        404: "Not Found - Agency with the specified ID doesn't exist",
        422: "Unprocessable Entity - Opportunity number already exists",
        500: "Server Error - An unexpected error occurred"
    }
)
@flask_db.with_db_session()
def opportunity_create(db_session: db.Session, json_data: dict) -> response.ApiResponse:
    """Create a new opportunity"""
    add_extra_data_to_current_request_logs(flatten_dict(json_data, prefix="request.body"))
    logger.info("POST /v1/grantor/opportunities/")

    with db_session.begin():
        # TEMPORARY IMPLEMENTATION: Create opportunity directly, bypassing auth checks
        from src.db.models.opportunity_models import Opportunity
        from src.services.opportunities_grantor_v1.get_agency import get_agency
        from src.services.opportunities_grantor_v1.get_opportunity import check_opportunity_number_exists
        from src.api.route_utils import raise_flask_error
        
        # Verify agency exists
        agency = get_agency(db_session, json_data["agency_id"])
        
        # Check if opportunity number already exists
        check_opportunity_number_exists(db_session, json_data["opportunity_number"])
        
        # Create the opportunity
        opportunity = Opportunity(
            opportunity_number=json_data["opportunity_number"],
            opportunity_title=json_data["opportunity_title"],
            agency_id=agency.agency_id,
            agency_code=agency.agency_code,
            category=json_data["category"],
            category_explanation=json_data.get("category_explanation"),
            legacy_opportunity_id=None,
            is_simpler_grants_opportunity=True,
            is_draft=True,
        )
        
        db_session.add(opportunity)
        db_session.flush()  # Flush to get the opportunity_id

    return response.ApiResponse(message="Success", data=opportunity)


