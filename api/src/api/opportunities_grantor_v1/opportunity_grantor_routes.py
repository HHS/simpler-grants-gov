import logging

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.api.opportunities_grantor_v1.opportunity_grantor_schemas as opportunity_grantor_schemas
import src.api.response as response
from src.api.opportunities_grantor_v1.opportunity_grantor_blueprint import (
    opportunity_grantor_blueprint,
)
from src.auth.multi_auth import jwt_or_api_user_key_multi_auth, jwt_or_api_user_key_security_schemes
from src.logging.flask_logger import add_extra_data_to_current_request_logs
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
@opportunity_grantor_blueprint.input(
    opportunity_grantor_schemas.OpportunityCreateRequestSchema, location="json"
)
@opportunity_grantor_blueprint.output(opportunity_grantor_schemas.OpportunityCreateResponseSchema())
@jwt_or_api_user_key_multi_auth.login_required
@opportunity_grantor_blueprint.doc(
    responses=[200, 403, 404, 422, 500], security=jwt_or_api_user_key_security_schemes
)
@flask_db.with_db_session()
def opportunity_create(db_session: db.Session, json_data: dict) -> response.ApiResponse:
    """Create a new opportunity"""
    add_extra_data_to_current_request_logs(flatten_dict(json_data, prefix="request.body"))
    logger.info("POST /v1/grantors/opportunities/")

    with db_session.begin():
        from flask_login import current_user

        from src.services.opportunities_grantor_v1.opportunity_creation import create_opportunity

        opportunity = create_opportunity(db_session, current_user, json_data)

    return response.ApiResponse(message="Success", data=opportunity)
