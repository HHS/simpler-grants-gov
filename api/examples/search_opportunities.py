"""
Example: Search CommonGrants opportunities via the /common-grants/opportunities/search endpoint.

Prerequisites:
    - API is running locally (make init && make run-logs)
    - A valid API key is set in the X-SGG-TOKEN header

Usage:
    python examples/search_opportunities.py
"""

import json

import requests

BASE_URL = "http://localhost:8080"
API_KEY = "your-api-key-here"

HEADERS = {
    "X-SGG-TOKEN": API_KEY,
    "Content-Type": "application/json",
}

# --- Basic search: open opportunities, first page ---

basic_search = {
    "pagination": {"page_offset": 1, "page_size": 25},
    "filters": {
        "status": {"one_of": ["posted"]},
    },
}

response = requests.post(
    f"{BASE_URL}/common-grants/opportunities/search",
    headers=HEADERS,
    json=basic_search,
)
print("Basic search status:", response.status_code)
data = response.json()
print("Total results:", data.get("pagination", {}).get("total_records"))

# --- customFilters: agency + applicant type ---
#
# Use filters.customFilters to narrow by Grants.gov-specific fields.
# Unsupported keys and invalid values are ignored; any skipped filters
# are reported in filterInfo.errors in the response.

custom_filter_search = {
    "pagination": {"page_offset": 1, "page_size": 10},
    "filters": {
        "customFilters": {
            "agency": {"operator": "in", "value": ["USAID"]},
            "applicantType": {
                "operator": "in",
                "value": ["government_state", "non_profit_with_501c3"],
            },
        }
    },
}

response = requests.post(
    f"{BASE_URL}/common-grants/opportunities/search",
    headers=HEADERS,
    json=custom_filter_search,
)
print("\ncustomFilters search status:", response.status_code)
data = response.json()
print("Results:", data.get("pagination", {}).get("total_records"))
print("filterInfo:", json.dumps(data.get("filterInfo", {}), indent=2))
