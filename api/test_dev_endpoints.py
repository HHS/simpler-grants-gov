#!/usr/bin/env python3
"""
API Endpoint Validation Script for dev.simpler.grants.gov

This script tests all available API endpoints to validate they are working
correctly after the API Gateway auth enforcement changes (PR #6764).

Features:
- Endpoint validation: Test all API endpoints for correct responses
- Auth enforcement testing: Verify endpoints require authentication
- Rate limit testing: Validate API Gateway rate limits (10 req/s, burst 15, 250k/month)
- SOAP proxy testing: Test legacy Grants.gov SOAP API proxy endpoints

Usage:
    # Test public endpoints only (no auth)
    poetry run python test_dev_endpoints.py

    # Test with API key for authenticated endpoints
    poetry run python test_dev_endpoints.py --api-key YOUR_API_KEY

    # Test auth enforcement (checks 401/403 without credentials)
    poetry run python test_dev_endpoints.py --test-auth-enforcement

    # Test rate limits (requires API key)
    poetry run python test_dev_endpoints.py --test-rate-limits --api-key YOUR_API_KEY

    # Test SOAP proxy endpoints
    poetry run python test_dev_endpoints.py --test-soap

    # Test SOAP auth enforcement (should NOT require API Gateway auth)
    poetry run python test_dev_endpoints.py --test-soap-auth

    # Or install requests globally:
    pip install requests

Environment Variables:
    API_KEY: API key for authenticated endpoints (optional for public endpoints)

Rate Limit Configuration (from API Gateway):
    - Rate: 10 requests/second
    - Burst: 15 requests
    - Monthly Quota: 250,000 requests

SOAP Endpoints (should use custom downstream auth, not API Gateway auth):
    - POST /grantsws-applicant/services/v2/ApplicantWebServicesSoapPort
    - POST /grantsws-agency/services/v2/AgencyWebServicesSoapPort
"""

import argparse
import json
import sys
import time
from dataclasses import dataclass
from enum import Enum
from typing import Any

try:
    import requests
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry
except ImportError:
    print("Error: 'requests' module not found.")
    print("\nTo install, run one of the following:")
    print("  pip install requests")
    print("  # Or in the api directory:")
    print("  poetry add requests --group dev")
    print("  # Or run with poetry:")
    print("  poetry run python test_dev_endpoints.py")
    sys.exit(1)


class AuthType(Enum):
    NONE = "none"  # No auth required
    API_KEY = "api_key"  # X-Api-Key header
    JWT = "jwt"  # X-SGG-Token header (login required)


class HttpMethod(Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"


@dataclass
class EndpointTest:
    """Defines an endpoint test case."""

    path: str
    method: HttpMethod
    auth_type: AuthType
    description: str
    request_body: dict | None = None
    path_params: dict | None = None
    query_params: dict | None = None
    expected_status: list[int] | None = None  # List of acceptable status codes
    skip_reason: str | None = None  # If set, skip this test with this reason


# Base URL for the dev environment
BASE_URL = "https://api.dev.simpler.grants.gov"

# Define all endpoints to test
ENDPOINTS: list[EndpointTest] = [
    # ============================================
    # Health Check - No Auth Required
    # ============================================
    EndpointTest(
        path="/health",
        method=HttpMethod.GET,
        auth_type=AuthType.NONE,
        description="Health check endpoint",
        expected_status=[200],
    ),
    # ============================================
    # Documentation Endpoints - No Auth Required
    # ============================================
    EndpointTest(
        path="/docs",
        method=HttpMethod.GET,
        auth_type=AuthType.NONE,
        description="Swagger/OpenAPI documentation",
        expected_status=[200],
    ),
    EndpointTest(
        path="/openapi.json",
        method=HttpMethod.GET,
        auth_type=AuthType.NONE,
        description="OpenAPI JSON specification",
        expected_status=[200],
    ),
    # ============================================
    # Opportunities V1 Endpoints - API Key Auth
    # ============================================
    EndpointTest(
        path="/v1/opportunities/search",
        method=HttpMethod.POST,
        auth_type=AuthType.API_KEY,
        description="Search opportunities",
        request_body={
            "pagination": {
                "page_offset": 1,
                "page_size": 5,
                "sort_order": [
                    {"order_by": "opportunity_id", "sort_direction": "ascending"}
                ],
            }
        },
        expected_status=[200],
    ),
    EndpointTest(
        path="/v1/opportunities/search",
        method=HttpMethod.POST,
        auth_type=AuthType.API_KEY,
        description="Search opportunities with query",
        request_body={
            "query": "research",
            "pagination": {
                "page_offset": 1,
                "page_size": 5,
                "sort_order": [
                    {"order_by": "opportunity_id", "sort_direction": "ascending"}
                ],
            },
        },
        expected_status=[200],
    ),
    EndpointTest(
        path="/v1/opportunities/search",
        method=HttpMethod.POST,
        auth_type=AuthType.API_KEY,
        description="Search opportunities with filters",
        request_body={
            "filters": {
                "opportunity_status": {"one_of": ["posted", "forecasted"]},
            },
            "pagination": {
                "page_offset": 1,
                "page_size": 5,
                "sort_order": [
                    {"order_by": "opportunity_id", "sort_direction": "ascending"}
                ],
            },
        },
        expected_status=[200],
    ),
    # Note: These endpoints require a valid opportunity_id which we'll get dynamically
    # ============================================
    # Agencies V1 Endpoints - API Key Auth
    # ============================================
    EndpointTest(
        path="/v1/agencies",
        method=HttpMethod.POST,
        auth_type=AuthType.API_KEY,
        description="List agencies",
        request_body={
            "pagination": {
                "page_offset": 1,
                "page_size": 10,
                "sort_order": [
                    {"order_by": "created_at", "sort_direction": "descending"}
                ],
            }
        },
        expected_status=[401],
    ),
    EndpointTest(
        path="/v1/agencies/search",
        method=HttpMethod.POST,
        auth_type=AuthType.API_KEY,
        description="Search agencies",
        request_body={
            "query": "USAID",
            "pagination": {
                "page_offset": 1,
                "page_size": 10,
                "sort_order": [
                    {"order_by": "agency_name", "sort_direction": "ascending"}
                ],
            },
        },
        expected_status=[200],
    ),
    # ============================================
    # Extracts V1 Endpoints - API Key Auth
    # ============================================
    EndpointTest(
        path="/v1/extracts",
        method=HttpMethod.POST,
        auth_type=AuthType.API_KEY,
        description="Get extract metadata",
        request_body={
            "pagination": {
                "page_offset": 1,
                "page_size": 10,
                "sort_order": [
                    {"order_by": "created_at", "sort_direction": "descending"}
                ],
            }
        },
        expected_status=[200],
    ),
    # ============================================
    # CommonGrants Protocol Endpoints - API Key Auth
    # ============================================
    EndpointTest(
        path="/common-grants/opportunities",
        method=HttpMethod.GET,
        auth_type=AuthType.API_KEY,
        description="CommonGrants - List opportunities",
        query_params={"page": 1, "pageSize": 5},
        expected_status=[200],
    ),
    EndpointTest(
        path="/common-grants/opportunities/search",
        method=HttpMethod.POST,
        auth_type=AuthType.API_KEY,
        description="CommonGrants - Search opportunities",
        request_body={
            "filters": {},
            "pagination": {"page": 1, "pageSize": 5},
        },
        expected_status=[200],
    ),
    # ============================================
    # User Authentication Endpoints - No Auth (for login flow)
    # ============================================
    EndpointTest(
        path="/v1/users/login",
        method=HttpMethod.GET,
        auth_type=AuthType.NONE,
        description="User login redirect (OAuth flow start)",
        expected_status=[302, 200],  # Should redirect to OAuth provider
    ),
    # ============================================
    # User Endpoints - JWT Auth Required
    # These endpoints require a valid JWT token from login
    # ============================================
    EndpointTest(
        path="/v1/users/token/logout",
        method=HttpMethod.POST,
        auth_type=AuthType.JWT,
        description="User logout",
        expected_status=[200, 401],  # 401 expected without valid JWT
        skip_reason="Requires valid JWT token from login flow",
    ),
    EndpointTest(
        path="/v1/users/token/refresh",
        method=HttpMethod.POST,
        auth_type=AuthType.JWT,
        description="Refresh user token",
        expected_status=[200, 401],
        skip_reason="Requires valid JWT token from login flow",
    ),
    # ============================================
    # Static/Bot Endpoints - No Auth Required
    # ============================================
    EndpointTest(
        path="/robots.txt",
        method=HttpMethod.GET,
        auth_type=AuthType.NONE,
        description="Robots.txt for crawlers",
        expected_status=[200, 404],  # May or may not exist
    ),
]


class EndpointTester:
    """Handles testing of API endpoints."""

    def __init__(
        self,
        base_url: str,
        api_key: str | None = None,
        jwt_token: str | None = None,
        verbose: bool = False,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.jwt_token = jwt_token
        self.verbose = verbose
        self.session = self._create_session()
        self.results: list[dict[str, Any]] = []
        self.opportunity_id: str | None = None
        self.legacy_opportunity_id: int | None = None

    def _create_session(self) -> requests.Session:
        """Create a requests session with retry logic."""
        session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=0.5,
            status_forcelist=[500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        return session

    def _get_headers(self, auth_type: AuthType) -> dict[str, str]:
        """Get headers based on authentication type."""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        if auth_type == AuthType.API_KEY and self.api_key:
            headers["X-Api-Key"] = self.api_key
        elif auth_type == AuthType.JWT and self.jwt_token:
            headers["X-SGG-Token"] = self.jwt_token

        return headers

    def _build_url(self, path: str, path_params: dict | None = None) -> str:
        """Build the full URL with path parameters."""
        url = f"{self.base_url}{path}"
        if path_params:
            for key, value in path_params.items():
                url = url.replace(f"{{{key}}}", str(value))
        return url

    def _fetch_sample_opportunity(self) -> None:
        """Fetch a sample opportunity ID for testing."""
        if self.opportunity_id:
            return

        try:
            response = self.session.post(
                f"{self.base_url}/v1/opportunities/search",
                headers=self._get_headers(AuthType.API_KEY),
                json={
                    "pagination": {
                        "page_offset": 1,
                        "page_size": 1,
                        "sort_order": [
                            {"order_by": "opportunity_id", "sort_direction": "ascending"}
                        ],
                    }
                },
                timeout=30,
            )
            if response.status_code == 200:
                data = response.json()
                if data.get("data") and len(data["data"]) > 0:
                    opp = data["data"][0]
                    self.opportunity_id = opp.get("opportunity_id")
                    # Legacy ID is typically a number
                    if "opportunity_number" in opp:
                        # Try to extract legacy ID from the data
                        pass
                    print(f"  📋 Found sample opportunity ID: {self.opportunity_id}")
        except Exception as e:
            print(f"  ⚠️  Could not fetch sample opportunity: {e}")

    def test_endpoint(self, endpoint: EndpointTest) -> dict[str, Any]:
        """Test a single endpoint and return the result."""
        result = {
            "path": endpoint.path,
            "method": endpoint.method.value,
            "description": endpoint.description,
            "auth_type": endpoint.auth_type.value,
            "success": False,
            "status_code": None,
            "response_time_ms": None,
            "error": None,
            "skipped": False,
        }

        # Check if test should be skipped
        if endpoint.skip_reason:
            result["skipped"] = True
            result["error"] = f"Skipped: {endpoint.skip_reason}"
            return result

        # Check auth requirements
        if endpoint.auth_type == AuthType.API_KEY and not self.api_key:
            result["error"] = "No API key provided"
            result["skipped"] = True
            return result

        if endpoint.auth_type == AuthType.JWT and not self.jwt_token:
            result["error"] = "No JWT token provided"
            result["skipped"] = True
            return result

        try:
            url = self._build_url(endpoint.path, endpoint.path_params)
            headers = self._get_headers(endpoint.auth_type)

            start_time = time.time()

            if endpoint.method == HttpMethod.GET:
                response = self.session.get(
                    url,
                    headers=headers,
                    params=endpoint.query_params,
                    timeout=30,
                    allow_redirects=False,
                )
            elif endpoint.method == HttpMethod.POST:
                response = self.session.post(
                    url,
                    headers=headers,
                    json=endpoint.request_body,
                    params=endpoint.query_params,
                    timeout=30,
                )
            elif endpoint.method == HttpMethod.PUT:
                response = self.session.put(
                    url,
                    headers=headers,
                    json=endpoint.request_body,
                    timeout=30,
                )
            elif endpoint.method == HttpMethod.DELETE:
                response = self.session.delete(
                    url,
                    headers=headers,
                    timeout=30,
                )
            elif endpoint.method == HttpMethod.PATCH:
                response = self.session.patch(
                    url,
                    headers=headers,
                    json=endpoint.request_body,
                    timeout=30,
                )
            else:
                result["error"] = f"Unsupported method: {endpoint.method}"
                return result

            end_time = time.time()
            result["response_time_ms"] = round((end_time - start_time) * 1000, 2)
            result["status_code"] = response.status_code

            # Check if status code is acceptable
            expected = endpoint.expected_status or [200]
            if response.status_code in expected:
                result["success"] = True
            else:
                result["error"] = f"Unexpected status code: {response.status_code}"
                if self.verbose:
                    try:
                        result["response_body"] = response.json()
                    except Exception:
                        result["response_body"] = response.text[:500]

        except requests.exceptions.Timeout:
            result["error"] = "Request timed out"
        except requests.exceptions.ConnectionError as e:
            result["error"] = f"Connection error: {str(e)}"
        except Exception as e:
            result["error"] = f"Error: {str(e)}"

        return result

    def add_dynamic_tests(self) -> list[EndpointTest]:
        """Add tests that require dynamic data (like opportunity IDs)."""
        dynamic_tests = []

        # First, try to get a sample opportunity ID
        self._fetch_sample_opportunity()

        if self.opportunity_id:
            # Test get opportunity by UUID
            dynamic_tests.append(
                EndpointTest(
                    path=f"/v1/opportunities/{self.opportunity_id}",
                    method=HttpMethod.GET,
                    auth_type=AuthType.API_KEY,
                    description=f"Get opportunity by ID ({self.opportunity_id[:8]}...)",
                    expected_status=[200],
                )
            )

            # Test CommonGrants get opportunity
            dynamic_tests.append(
                EndpointTest(
                    path=f"/common-grants/opportunities/{self.opportunity_id}",
                    method=HttpMethod.GET,
                    auth_type=AuthType.API_KEY,
                    description=f"CommonGrants - Get opportunity ({self.opportunity_id[:8]}...)",
                    expected_status=[200],
                )
            )

        return dynamic_tests

    def run_all_tests(self) -> None:
        """Run all endpoint tests."""
        print("\n" + "=" * 70)
        print("🚀 Simpler.Grants.gov API Endpoint Validation")
        print(f"   Target: {self.base_url}")
        print(f"   API Key: {'✓ Provided' if self.api_key else '✗ Not provided'}")
        print(f"   JWT Token: {'✓ Provided' if self.jwt_token else '✗ Not provided'}")
        print("=" * 70 + "\n")

        # Combine static and dynamic tests
        all_tests = ENDPOINTS.copy()

        # Add dynamic tests if we have an API key
        if self.api_key:
            dynamic_tests = self.add_dynamic_tests()
            all_tests.extend(dynamic_tests)

        total = len(all_tests)
        passed = 0
        failed = 0
        skipped = 0

        for i, endpoint in enumerate(all_tests, 1):
            print(f"[{i}/{total}] Testing: {endpoint.method.value} {endpoint.path}")
            print(f"         {endpoint.description}")

            result = self.test_endpoint(endpoint)
            self.results.append(result)

            if result["skipped"]:
                skipped += 1
                print(f"         ⏭️  SKIPPED: {result.get('error', 'Unknown reason')}")
            elif result["success"]:
                passed += 1
                print(
                    f"         ✅ PASSED (Status: {result['status_code']}, "
                    f"Time: {result['response_time_ms']}ms)"
                )
            else:
                failed += 1
                print(f"         ❌ FAILED: {result.get('error', 'Unknown error')}")
                if result.get("status_code"):
                    print(f"            Status Code: {result['status_code']}")

            print()

        # Print summary
        print("\n" + "=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        print(f"   Total Tests:  {total}")
        print(f"   ✅ Passed:    {passed}")
        print(f"   ❌ Failed:    {failed}")
        print(f"   ⏭️  Skipped:   {skipped}")
        print("=" * 70)

        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if not result["success"] and not result["skipped"]:
                    print(f"   - {result['method']} {result['path']}")
                    print(f"     Error: {result.get('error', 'Unknown')}")

        print()

    def export_results(self, filename: str) -> None:
        """Export test results to a JSON file."""
        with open(filename, "w") as f:
            json.dump(
                {
                    "base_url": self.base_url,
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
                    "results": self.results,
                },
                f,
                indent=2,
            )
        print(f"📄 Results exported to: {filename}")


def test_auth_enforcement() -> None:
    """
    Test that API Gateway auth enforcement is working correctly.
    This tests that endpoints requiring auth return 401/403 without credentials.
    """
    print("\n" + "=" * 70)
    print("🔒 Testing API Gateway Auth Enforcement")
    print("=" * 70 + "\n")

    session = requests.Session()
    results = []

    # Endpoints that should require API key auth
    auth_required_endpoints = [
        ("POST", "/v1/opportunities/search", {"pagination": {"page_offset": 1, "page_size": 1}}),
        ("POST", "/v1/agencies", {"pagination": {"page_offset": 1, "page_size": 1}}),
        ("POST", "/v1/agencies/search", {"query": "test", "pagination": {"page_offset": 1, "page_size": 1}}),
        ("POST", "/v1/extracts", {"pagination": {"page_offset": 1, "page_size": 1}}),
        ("GET", "/common-grants/opportunities", None),
        ("POST", "/common-grants/opportunities/search", {}),
    ]

    # Endpoints that should NOT require auth
    no_auth_endpoints = [
        ("GET", "/health", None),
        ("GET", "/docs", None),
        ("GET", "/v1/users/login", None),
    ]

    print("Testing endpoints that SHOULD require auth (expecting 401/403 without key):\n")
    for method, path, body in auth_required_endpoints:
        url = f"{BASE_URL}{path}"
        try:
            if method == "GET":
                resp = session.get(url, timeout=10, allow_redirects=False)
            else:
                resp = session.post(url, json=body, timeout=10)

            # With auth enforcement, we expect 401 or 403 without API key
            if resp.status_code in [401, 403]:
                print(f"  ✅ {method} {path} - Auth enforced (Status: {resp.status_code})")
                results.append({"path": path, "auth_enforced": True})
            elif resp.status_code == 200:
                print(f"  ⚠️  {method} {path} - No auth required! (Status: {resp.status_code})")
                results.append({"path": path, "auth_enforced": False})
            else:
                print(f"  ❓ {method} {path} - Unexpected status: {resp.status_code}")
                results.append({"path": path, "auth_enforced": None, "status": resp.status_code})
        except Exception as e:
            print(f"  ❌ {method} {path} - Error: {e}")
            results.append({"path": path, "error": str(e)})

    print("\nTesting endpoints that should NOT require auth:\n")
    for method, path, body in no_auth_endpoints:
        url = f"{BASE_URL}{path}"
        try:
            if method == "GET":
                resp = session.get(url, timeout=10, allow_redirects=False)
            else:
                resp = session.post(url, json=body, timeout=10)

            if resp.status_code in [200, 302]:
                print(f"  ✅ {method} {path} - Accessible without auth (Status: {resp.status_code})")
            else:
                print(f"  ⚠️  {method} {path} - Unexpected status: {resp.status_code}")
        except Exception as e:
            print(f"  ❌ {method} {path} - Error: {e}")

    print()


@dataclass
class RateLimitConfig:
    """Configuration for rate limit testing."""

    rate_limit: int = 10  # Requests per second
    burst_limit: int = 15  # Maximum burst size
    monthly_quota: int = 250000  # Requests per month


@dataclass
class RateLimitTestResult:
    """Results from a rate limit test."""

    test_name: str
    total_requests: int
    successful_requests: int
    rate_limited_requests: int
    error_requests: int
    rate_limit_triggered: bool
    first_rate_limit_at: int | None
    avg_response_time_ms: float
    requests_per_second: float
    details: list[dict[str, Any]]


def test_rate_limits(
    api_key: str,
    base_url: str = BASE_URL,
    config: RateLimitConfig | None = None,
    verbose: bool = False,
) -> dict[str, Any]:
    """
    Test API Gateway rate limiting.

    Rate Limit Configuration (from API Gateway):
    - Rate: 10 requests/second
    - Burst: 15 requests
    - Monthly Quota: 250,000 requests

    This test will:
    1. Test sustained rate at the limit (10 req/s)
    2. Test burst behavior (15+ requests quickly)
    3. Verify 429 responses when limits are exceeded
    """
    if config is None:
        config = RateLimitConfig()

    print("\n" + "=" * 70)
    print("⚡ Testing API Gateway Rate Limits")
    print("=" * 70)
    print(f"\n   Target: {base_url}")
    print(f"   API Key: {'✓ Provided' if api_key else '✗ Not provided'}")
    print(f"\n   Expected Limits:")
    print(f"   - Rate Limit: {config.rate_limit} requests/second")
    print(f"   - Burst Limit: {config.burst_limit} requests")
    print(f"   - Monthly Quota: {config.monthly_quota:,} requests")
    print("=" * 70 + "\n")

    if not api_key:
        print("❌ Error: API key is required for rate limit testing")
        return {"error": "API key required"}

    session = requests.Session()
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Api-Key": api_key,
    }

    # Use a lightweight endpoint for testing
    test_url = f"{base_url}/health"
    test_results: dict[str, Any] = {
        "config": {
            "rate_limit": config.rate_limit,
            "burst_limit": config.burst_limit,
            "monthly_quota": config.monthly_quota,
        },
        "tests": {},
    }

    # =========================================================================
    # Test 1: Burst Test - Send requests as fast as possible
    # =========================================================================
    print("📊 Test 1: Burst Test")
    print(f"   Sending {config.burst_limit + 10} requests as fast as possible...")
    print(f"   Expected: First {config.burst_limit} succeed, then 429 responses\n")

    burst_results = _run_burst_test(
        session=session,
        url=test_url,
        headers=headers,
        num_requests=config.burst_limit + 10,
        verbose=verbose,
    )
    test_results["tests"]["burst"] = burst_results

    _print_test_summary("Burst Test", burst_results)

    # Wait for rate limit to reset
    print("\n   ⏳ Waiting 2 seconds for rate limit to reset...\n")
    time.sleep(2)

    # =========================================================================
    # Test 2: Sustained Rate Test - Send at exactly the rate limit
    # =========================================================================
    print("📊 Test 2: Sustained Rate Test")
    print(f"   Sending {config.rate_limit * 3} requests at {config.rate_limit} req/s...")
    print("   Expected: All requests should succeed (within rate limit)\n")

    sustained_results = _run_sustained_rate_test(
        session=session,
        url=test_url,
        headers=headers,
        rate_per_second=config.rate_limit,
        duration_seconds=3,
        verbose=verbose,
    )
    test_results["tests"]["sustained_rate"] = sustained_results

    _print_test_summary("Sustained Rate Test", sustained_results)

    # Wait for rate limit to reset
    print("\n   ⏳ Waiting 2 seconds for rate limit to reset...\n")
    time.sleep(2)

    # =========================================================================
    # Test 3: Over Rate Test - Send at 2x the rate limit
    # =========================================================================
    print("📊 Test 3: Over Rate Test")
    over_rate = config.rate_limit * 2
    print(f"   Sending requests at {over_rate} req/s (2x rate limit)...")
    print("   Expected: Some requests should get 429 responses\n")

    over_rate_results = _run_sustained_rate_test(
        session=session,
        url=test_url,
        headers=headers,
        rate_per_second=over_rate,
        duration_seconds=3,
        verbose=verbose,
    )
    test_results["tests"]["over_rate"] = over_rate_results

    _print_test_summary("Over Rate Test", over_rate_results)

    # Wait for rate limit to reset
    print("\n   ⏳ Waiting 2 seconds for rate limit to reset...\n")
    time.sleep(2)

    # =========================================================================
    # Test 4: Authenticated Endpoint Burst Test
    # =========================================================================
    print("📊 Test 4: Authenticated Endpoint Burst Test")
    print(f"   Testing POST /v1/opportunities/search with {config.burst_limit + 5} rapid requests...")
    print("   Expected: Rate limiting should apply to authenticated endpoints\n")

    auth_endpoint_url = f"{base_url}/v1/opportunities/search"
    auth_body = {
        "pagination": {
            "page_offset": 1,
            "page_size": 1,
            "sort_order": [{"order_by": "opportunity_id", "sort_direction": "ascending"}],
        }
    }

    auth_burst_results = _run_burst_test(
        session=session,
        url=auth_endpoint_url,
        headers=headers,
        num_requests=config.burst_limit + 5,
        method="POST",
        body=auth_body,
        verbose=verbose,
    )
    test_results["tests"]["auth_endpoint_burst"] = auth_burst_results

    _print_test_summary("Auth Endpoint Burst Test", auth_burst_results)

    # =========================================================================
    # Summary
    # =========================================================================
    print("\n" + "=" * 70)
    print("📊 RATE LIMIT TEST SUMMARY")
    print("=" * 70)

    all_tests_passed = True

    # Check burst test
    burst = test_results["tests"]["burst"]
    if burst["rate_limited_requests"] > 0:
        print(f"   ✅ Burst Test: Rate limiting triggered after {burst['first_rate_limit_at']} requests")
    else:
        print("   ⚠️  Burst Test: No rate limiting detected (may need more requests)")
        all_tests_passed = False

    # Check sustained rate test
    sustained = test_results["tests"]["sustained_rate"]
    if sustained["rate_limited_requests"] == 0:
        print(f"   ✅ Sustained Rate Test: All {sustained['successful_requests']} requests succeeded")
    else:
        print(f"   ⚠️  Sustained Rate Test: {sustained['rate_limited_requests']} requests rate limited")

    # Check over rate test
    over = test_results["tests"]["over_rate"]
    if over["rate_limited_requests"] > 0:
        print(f"   ✅ Over Rate Test: Rate limiting triggered ({over['rate_limited_requests']} limited)")
    else:
        print("   ⚠️  Over Rate Test: No rate limiting detected at 2x rate")

    # Check auth endpoint test
    auth = test_results["tests"]["auth_endpoint_burst"]
    if auth["rate_limited_requests"] > 0:
        print(f"   ✅ Auth Endpoint Test: Rate limiting triggered after {auth['first_rate_limit_at']} requests")
    else:
        print("   ⚠️  Auth Endpoint Test: No rate limiting detected")

    print("=" * 70 + "\n")

    return test_results


def _run_burst_test(
    session: requests.Session,
    url: str,
    headers: dict[str, str],
    num_requests: int,
    method: str = "GET",
    body: dict | None = None,
    verbose: bool = False,
) -> dict[str, Any]:
    """Run a burst test - send requests as fast as possible."""
    results: list[dict[str, Any]] = []
    start_time = time.time()

    for i in range(num_requests):
        req_start = time.time()
        try:
            if method == "GET":
                resp = session.get(url, headers=headers, timeout=10)
            else:
                resp = session.post(url, headers=headers, json=body, timeout=10)

            req_end = time.time()
            result = {
                "request_num": i + 1,
                "status_code": resp.status_code,
                "response_time_ms": round((req_end - req_start) * 1000, 2),
                "rate_limited": resp.status_code == 429,
            }

            if verbose:
                status_icon = "🚫" if resp.status_code == 429 else "✓"
                print(f"      [{i + 1}] {status_icon} Status: {resp.status_code} ({result['response_time_ms']}ms)")

        except Exception as e:
            result = {
                "request_num": i + 1,
                "status_code": None,
                "error": str(e),
                "rate_limited": False,
            }
            if verbose:
                print(f"      [{i + 1}] ❌ Error: {e}")

        results.append(result)

    end_time = time.time()
    total_time = end_time - start_time

    # Analyze results
    successful = sum(1 for r in results if r.get("status_code") == 200)
    rate_limited = sum(1 for r in results if r.get("rate_limited"))
    errors = sum(1 for r in results if r.get("error"))

    first_rate_limit = None
    for r in results:
        if r.get("rate_limited"):
            first_rate_limit = r["request_num"]
            break

    avg_response_time = sum(
        r.get("response_time_ms", 0) for r in results if r.get("response_time_ms")
    ) / max(len([r for r in results if r.get("response_time_ms")]), 1)

    return {
        "total_requests": num_requests,
        "successful_requests": successful,
        "rate_limited_requests": rate_limited,
        "error_requests": errors,
        "rate_limit_triggered": rate_limited > 0,
        "first_rate_limit_at": first_rate_limit,
        "avg_response_time_ms": round(avg_response_time, 2),
        "requests_per_second": round(num_requests / total_time, 2),
        "total_time_seconds": round(total_time, 2),
        "details": results if verbose else [],
    }


def _run_sustained_rate_test(
    session: requests.Session,
    url: str,
    headers: dict[str, str],
    rate_per_second: int,
    duration_seconds: int,
    method: str = "GET",
    body: dict | None = None,
    verbose: bool = False,
) -> dict[str, Any]:
    """Run a sustained rate test - send requests at a specific rate."""
    results: list[dict[str, Any]] = []
    interval = 1.0 / rate_per_second
    total_requests = rate_per_second * duration_seconds

    start_time = time.time()

    for i in range(total_requests):
        req_start = time.time()
        try:
            if method == "GET":
                resp = session.get(url, headers=headers, timeout=10)
            else:
                resp = session.post(url, headers=headers, json=body, timeout=10)

            req_end = time.time()
            result = {
                "request_num": i + 1,
                "status_code": resp.status_code,
                "response_time_ms": round((req_end - req_start) * 1000, 2),
                "rate_limited": resp.status_code == 429,
            }

            if verbose:
                status_icon = "🚫" if resp.status_code == 429 else "✓"
                print(f"      [{i + 1}] {status_icon} Status: {resp.status_code} ({result['response_time_ms']}ms)")

        except Exception as e:
            result = {
                "request_num": i + 1,
                "status_code": None,
                "error": str(e),
                "rate_limited": False,
            }
            if verbose:
                print(f"      [{i + 1}] ❌ Error: {e}")

        results.append(result)

        # Wait to maintain the target rate
        elapsed = time.time() - req_start
        sleep_time = max(0, interval - elapsed)
        if sleep_time > 0:
            time.sleep(sleep_time)

    end_time = time.time()
    total_time = end_time - start_time

    # Analyze results
    successful = sum(1 for r in results if r.get("status_code") == 200)
    rate_limited = sum(1 for r in results if r.get("rate_limited"))
    errors = sum(1 for r in results if r.get("error"))

    first_rate_limit = None
    for r in results:
        if r.get("rate_limited"):
            first_rate_limit = r["request_num"]
            break

    avg_response_time = sum(
        r.get("response_time_ms", 0) for r in results if r.get("response_time_ms")
    ) / max(len([r for r in results if r.get("response_time_ms")]), 1)

    return {
        "total_requests": total_requests,
        "successful_requests": successful,
        "rate_limited_requests": rate_limited,
        "error_requests": errors,
        "rate_limit_triggered": rate_limited > 0,
        "first_rate_limit_at": first_rate_limit,
        "avg_response_time_ms": round(avg_response_time, 2),
        "target_rate": rate_per_second,
        "actual_requests_per_second": round(total_requests / total_time, 2),
        "total_time_seconds": round(total_time, 2),
        "details": results if verbose else [],
    }


def _print_test_summary(test_name: str, results: dict[str, Any]) -> None:
    """Print a summary of a rate limit test."""
    print(f"   Results for {test_name}:")
    print(f"      Total Requests: {results['total_requests']}")
    print(f"      Successful (200): {results['successful_requests']}")
    print(f"      Rate Limited (429): {results['rate_limited_requests']}")
    print(f"      Errors: {results['error_requests']}")
    print(f"      Avg Response Time: {results['avg_response_time_ms']}ms")

    if "target_rate" in results:
        print(f"      Target Rate: {results['target_rate']} req/s")
        print(f"      Actual Rate: {results['actual_requests_per_second']} req/s")
    else:
        print(f"      Actual Rate: {results['requests_per_second']} req/s")

    if results["first_rate_limit_at"]:
        print(f"      First 429 at request: #{results['first_rate_limit_at']}")


# =============================================================================
# SOAP Endpoint Testing
# =============================================================================

# SOAP request templates for testing
SOAP_GET_OPPORTUNITY_LIST_REQUEST = """<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0"
    xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0"
    xmlns:app1="http://apply.grants.gov/system/ApplicantCommonElements-V1.0">
   <soapenv:Header/>
   <soapenv:Body>
      <app:GetOpportunityListRequest>
         <app1:OpportunityFilter>
            <gran:FundingOpportunityNumber>HHS-2024-ACF-OCS-EE-0034</gran:FundingOpportunityNumber>
         </app1:OpportunityFilter>
      </app:GetOpportunityListRequest>
   </soapenv:Body>
</soapenv:Envelope>"""

SOAP_GET_GRANT_OPPORTUNITIES_REQUEST = """<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0"
    xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0"
    xmlns:agen1="http://apply.grants.gov/system/AgencyCommonElements-V1.0">
   <soapenv:Header/>
   <soapenv:Body>
      <agen:GetGrantOpportunitiesRequest>
         <agen1:OpportunityFilter>
            <gran:FundingOpportunityNumber>HHS-2024-ACF-OCS-EE-0034</gran:FundingOpportunityNumber>
         </agen1:OpportunityFilter>
      </agen:GetGrantOpportunitiesRequest>
   </soapenv:Body>
</soapenv:Envelope>"""


@dataclass
class SoapEndpointTest:
    """Defines a SOAP endpoint test case."""

    service_name: str
    service_port_name: str
    operation_name: str
    request_body: str
    description: str
    expected_status: list[int]


# SOAP endpoints to test
SOAP_ENDPOINTS: list[SoapEndpointTest] = [
    SoapEndpointTest(
        service_name="grantsws-applicant",
        service_port_name="ApplicantWebServicesSoapPort",
        operation_name="GetOpportunityList",
        request_body=SOAP_GET_OPPORTUNITY_LIST_REQUEST,
        description="Applicant SOAP API - GetOpportunityList",
        expected_status=[200],
    ),
    SoapEndpointTest(
        service_name="grantsws-agency",
        service_port_name="AgencyWebServicesSoapPort",
        operation_name="GetGrantOpportunities",
        request_body=SOAP_GET_GRANT_OPPORTUNITIES_REQUEST,
        description="Agency SOAP API - GetGrantOpportunities",
        expected_status=[200],
    ),
]


def test_soap_endpoints(
    base_url: str = BASE_URL,
    api_key: str | None = None,
    verbose: bool = False,
) -> dict[str, Any]:
    """
    Test legacy SOAP API proxy endpoints.

    These endpoints proxy requests to Grants.gov's legacy SOAP APIs:
    - Applicant Web Services: /grantsws-applicant/services/v2/ApplicantWebServicesSoapPort
    - Agency Web Services: /grantsws-agency/services/v2/AgencyWebServicesSoapPort

    The SOAP endpoints have their own authentication (mTLS certificates) and
    should NOT require API Gateway auth (per PR #6764 comments).
    """
    print("\n" + "=" * 70)
    print("🧼 Testing Legacy SOAP API Proxy Endpoints")
    print("=" * 70)
    print(f"\n   Target: {base_url}")
    print(f"   API Key: {'✓ Provided' if api_key else '✗ Not provided (testing without)'}")
    print("\n   SOAP Endpoints (should have custom downstream auth, not API Gateway auth):")
    print("   - POST /<service_name>/services/v2/<service_port_name>")
    print("=" * 70 + "\n")

    session = requests.Session()
    results: dict[str, Any] = {
        "base_url": base_url,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "tests": [],
    }

    # Test 1: SOAP endpoints WITHOUT API key (should work - custom auth)
    print("📊 Test 1: SOAP Endpoints Without API Key")
    print("   These should work as they use custom downstream auth (mTLS)\n")

    for endpoint in SOAP_ENDPOINTS:
        url = f"{base_url}/{endpoint.service_name}/services/v2/{endpoint.service_port_name}"
        headers = {
            "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": f'"{endpoint.operation_name}"',
        }

        test_result = {
            "endpoint": f"/{endpoint.service_name}/services/v2/{endpoint.service_port_name}",
            "operation": endpoint.operation_name,
            "description": endpoint.description,
            "with_api_key": False,
        }

        try:
            start_time = time.time()
            resp = session.post(
                url,
                headers=headers,
                data=endpoint.request_body.encode("utf-8"),
                timeout=30,
            )
            end_time = time.time()

            test_result["status_code"] = resp.status_code
            test_result["response_time_ms"] = round((end_time - start_time) * 1000, 2)
            test_result["success"] = resp.status_code in endpoint.expected_status

            # Check for SOAP fault or error in response
            response_text = resp.text[:1000] if resp.text else ""
            test_result["is_soap_response"] = "Envelope" in response_text
            test_result["has_soap_fault"] = "Fault" in response_text

            if verbose:
                test_result["response_preview"] = response_text[:500]

            if resp.status_code == 200:
                print(f"   ✅ {endpoint.description}")
                print(f"      Status: {resp.status_code}, Time: {test_result['response_time_ms']}ms")
                if test_result["has_soap_fault"]:
                    print("      ⚠️  Response contains SOAP Fault (may be expected)")
            elif resp.status_code in [401, 403]:
                print(f"   🔒 {endpoint.description}")
                print(f"      Status: {resp.status_code} - Auth required (API Gateway enforcing)")
                test_result["auth_enforced"] = True
            elif resp.status_code == 429:
                print(f"   🚫 {endpoint.description}")
                print(f"      Status: {resp.status_code} - Rate limited")
            else:
                print(f"   ❓ {endpoint.description}")
                print(f"      Status: {resp.status_code} - Unexpected")

        except requests.exceptions.Timeout:
            test_result["error"] = "Request timed out"
            print(f"   ⏱️  {endpoint.description} - Timeout")
        except Exception as e:
            test_result["error"] = str(e)
            print(f"   ❌ {endpoint.description} - Error: {e}")

        results["tests"].append(test_result)

    # Test 2: SOAP endpoints WITH API key (if provided)
    if api_key:
        print("\n📊 Test 2: SOAP Endpoints With API Key")
        print("   Testing if API key affects SOAP endpoint behavior\n")

        for endpoint in SOAP_ENDPOINTS:
            url = f"{base_url}/{endpoint.service_name}/services/v2/{endpoint.service_port_name}"
            headers = {
                "Content-Type": "text/xml; charset=utf-8",
                "SOAPAction": f'"{endpoint.operation_name}"',
                "X-Api-Key": api_key,
            }

            test_result = {
                "endpoint": f"/{endpoint.service_name}/services/v2/{endpoint.service_port_name}",
                "operation": endpoint.operation_name,
                "description": endpoint.description,
                "with_api_key": True,
            }

            try:
                start_time = time.time()
                resp = session.post(
                    url,
                    headers=headers,
                    data=endpoint.request_body.encode("utf-8"),
                    timeout=30,
                )
                end_time = time.time()

                test_result["status_code"] = resp.status_code
                test_result["response_time_ms"] = round((end_time - start_time) * 1000, 2)
                test_result["success"] = resp.status_code in endpoint.expected_status

                response_text = resp.text[:1000] if resp.text else ""
                test_result["is_soap_response"] = "Envelope" in response_text
                test_result["has_soap_fault"] = "Fault" in response_text

                if verbose:
                    test_result["response_preview"] = response_text[:500]

                if resp.status_code == 200:
                    print(f"   ✅ {endpoint.description}")
                    print(f"      Status: {resp.status_code}, Time: {test_result['response_time_ms']}ms")
                else:
                    print(f"   ❓ {endpoint.description}")
                    print(f"      Status: {resp.status_code}")

            except Exception as e:
                test_result["error"] = str(e)
                print(f"   ❌ {endpoint.description} - Error: {e}")

            results["tests"].append(test_result)

    # Test 3: Invalid SOAP endpoint paths
    print("\n📊 Test 3: Invalid SOAP Endpoint Paths")
    print("   Testing that invalid service names return appropriate errors\n")

    invalid_endpoints = [
        ("invalid-service", "InvalidPort", "Invalid service name"),
        ("grantsws-applicant", "InvalidPort", "Invalid port name"),
    ]

    for service_name, port_name, description in invalid_endpoints:
        url = f"{base_url}/{service_name}/services/v2/{port_name}"
        headers = {"Content-Type": "text/xml; charset=utf-8"}

        test_result = {
            "endpoint": f"/{service_name}/services/v2/{port_name}",
            "description": description,
            "is_invalid_path_test": True,
        }

        try:
            resp = session.post(
                url,
                headers=headers,
                data=SOAP_GET_OPPORTUNITY_LIST_REQUEST.encode("utf-8"),
                timeout=30,
            )

            test_result["status_code"] = resp.status_code

            # Invalid paths should return an error (likely 400 or 404 or SOAP fault)
            if resp.status_code in [400, 404, 500] or "Fault" in resp.text:
                print(f"   ✅ {description} - Correctly rejected (Status: {resp.status_code})")
                test_result["correctly_rejected"] = True
            elif resp.status_code in [401, 403]:
                print(f"   🔒 {description} - Auth required before path validation")
                test_result["auth_enforced"] = True
            else:
                print(f"   ❓ {description} - Status: {resp.status_code}")

        except Exception as e:
            test_result["error"] = str(e)
            print(f"   ❌ {description} - Error: {e}")

        results["tests"].append(test_result)

    # Summary
    print("\n" + "=" * 70)
    print("📊 SOAP ENDPOINT TEST SUMMARY")
    print("=" * 70)

    successful = sum(1 for t in results["tests"] if t.get("success"))
    auth_enforced = sum(1 for t in results["tests"] if t.get("auth_enforced"))
    errors = sum(1 for t in results["tests"] if t.get("error"))
    total = len(results["tests"])

    print(f"   Total Tests: {total}")
    print(f"   ✅ Successful: {successful}")
    print(f"   🔒 Auth Enforced: {auth_enforced}")
    print(f"   ❌ Errors: {errors}")

    if auth_enforced > 0:
        print("\n   ⚠️  Note: Some SOAP endpoints require API Gateway auth.")
        print("      This may be intentional or may need to be excluded from auth enforcement.")

    print("=" * 70 + "\n")

    return results


def test_soap_auth_enforcement(base_url: str = BASE_URL) -> dict[str, Any]:
    """
    Specifically test whether SOAP endpoints are subject to API Gateway auth enforcement.

    According to PR #6764 comments, SOAP endpoints should have custom downstream auth
    and should NOT require API Gateway auth.
    """
    print("\n" + "=" * 70)
    print("🔒 Testing SOAP Endpoint Auth Enforcement")
    print("=" * 70)
    print(f"\n   Target: {base_url}")
    print("\n   Expected behavior:")
    print("   - SOAP endpoints should NOT require API Gateway auth (X-Api-Key)")
    print("   - They use custom downstream auth (mTLS certificates)")
    print("=" * 70 + "\n")

    session = requests.Session()
    results: dict[str, Any] = {
        "base_url": base_url,
        "tests": [],
    }

    for endpoint in SOAP_ENDPOINTS:
        url = f"{base_url}/{endpoint.service_name}/services/v2/{endpoint.service_port_name}"
        headers = {
            "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": f'"{endpoint.operation_name}"',
        }

        test_result = {
            "endpoint": f"/{endpoint.service_name}/services/v2/{endpoint.service_port_name}",
            "operation": endpoint.operation_name,
        }

        try:
            resp = session.post(
                url,
                headers=headers,
                data=endpoint.request_body.encode("utf-8"),
                timeout=30,
            )

            test_result["status_code"] = resp.status_code

            if resp.status_code in [401, 403]:
                print(f"   🔒 POST {test_result['endpoint']}")
                print(f"      Auth ENFORCED - Status: {resp.status_code}")
                print("      ⚠️  This endpoint requires API Gateway auth!")
                test_result["auth_enforced"] = True
                test_result["needs_exclusion"] = True
            elif resp.status_code == 200:
                print(f"   ✅ POST {test_result['endpoint']}")
                print(f"      No API Gateway auth required - Status: {resp.status_code}")
                test_result["auth_enforced"] = False
            else:
                print(f"   ❓ POST {test_result['endpoint']}")
                print(f"      Unexpected status: {resp.status_code}")
                test_result["auth_enforced"] = None

        except Exception as e:
            test_result["error"] = str(e)
            print(f"   ❌ POST {test_result['endpoint']} - Error: {e}")

        results["tests"].append(test_result)

    # Summary
    print("\n" + "-" * 70)
    auth_enforced_count = sum(1 for t in results["tests"] if t.get("auth_enforced"))
    if auth_enforced_count > 0:
        print(f"   ⚠️  {auth_enforced_count} SOAP endpoint(s) have API Gateway auth enforced!")
        print("      These may need to be excluded from auth enforcement in api_gateway.tf")
    else:
        print("   ✅ No SOAP endpoints have API Gateway auth enforced")
        print("      SOAP endpoints correctly use downstream auth only")
    print()

    return results


def run_all_tests(
    base_url: str = BASE_URL,
    api_key: str | None = None,
    jwt_token: str | None = None,
    verbose: bool = False,
    output_file: str | None = None,
    rate_limit_config: RateLimitConfig | None = None,
    skip_rate_limits: bool = False,
) -> dict[str, Any]:
    """
    Run ALL available tests and combine results into a single output.

    Tests included:
    1. Auth enforcement (no credentials)
    2. SOAP auth enforcement
    3. SOAP endpoint functionality
    4. Rate limits (if API key provided and not skipped)
    5. Endpoint validation
    """
    print("\n" + "=" * 70)
    print("🧪 RUNNING ALL API TESTS")
    print("=" * 70)
    print(f"\n   Target: {base_url}")
    print(f"   API Key: {'✓ Provided' if api_key else '✗ Not provided'}")
    print(f"   JWT Token: {'✓ Provided' if jwt_token else '✗ Not provided'}")
    print(f"   Skip Rate Limits: {'Yes' if skip_rate_limits else 'No'}")
    print("=" * 70 + "\n")

    all_results: dict[str, Any] = {
        "metadata": {
            "base_url": base_url,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            "api_key_provided": api_key is not None,
            "jwt_token_provided": jwt_token is not None,
        },
        "tests": {},
        "summary": {
            "total_test_suites": 0,
            "passed_suites": 0,
            "failed_suites": 0,
        },
    }

    # =========================================================================
    # Test 1: Auth Enforcement (without credentials)
    # =========================================================================
    print("\n" + "=" * 70)
    print("📋 Test Suite 1/5: Auth Enforcement")
    print("=" * 70)

    session = requests.Session()
    auth_results: list[dict[str, Any]] = []

    auth_required_endpoints = [
        ("POST", "/v1/opportunities/search", {"pagination": {"page_offset": 1, "page_size": 1}}),
        ("POST", "/v1/agencies", {"pagination": {"page_offset": 1, "page_size": 1}}),
        ("POST", "/v1/agencies/search", {"query": "test", "pagination": {"page_offset": 1, "page_size": 1}}),
        ("GET", "/common-grants/opportunities", None),
        ("POST", "/common-grants/opportunities/search", {}),
    ]

    no_auth_endpoints = [
        ("GET", "/health", None),
        ("GET", "/docs", None),
        ("GET", "/v1/users/login", None),
    ]

    print("\nTesting endpoints that SHOULD require auth:\n")
    for method, path, body in auth_required_endpoints:
        url = f"{base_url}{path}"
        try:
            if method == "GET":
                resp = session.get(url, timeout=10, allow_redirects=False)
            else:
                resp = session.post(url, json=body, timeout=10)

            auth_enforced = resp.status_code in [401, 403]
            result = {
                "endpoint": path,
                "method": method,
                "status_code": resp.status_code,
                "auth_enforced": auth_enforced,
                "expected_auth": True,
            }
            auth_results.append(result)

            if auth_enforced:
                print(f"   ✅ {method} {path} - Auth enforced ({resp.status_code})")
            else:
                print(f"   ⚠️  {method} {path} - No auth! ({resp.status_code})")
        except Exception as e:
            auth_results.append({"endpoint": path, "method": method, "error": str(e)})
            print(f"   ❌ {method} {path} - Error: {e}")

    print("\nTesting endpoints that should NOT require auth:\n")
    for method, path, body in no_auth_endpoints:
        url = f"{base_url}{path}"
        try:
            if method == "GET":
                resp = session.get(url, timeout=10, allow_redirects=False)
            else:
                resp = session.post(url, json=body, timeout=10)

            accessible = resp.status_code in [200, 302]
            result = {
                "endpoint": path,
                "method": method,
                "status_code": resp.status_code,
                "accessible_without_auth": accessible,
                "expected_auth": False,
            }
            auth_results.append(result)

            if accessible:
                print(f"   ✅ {method} {path} - Accessible ({resp.status_code})")
            else:
                print(f"   ⚠️  {method} {path} - Unexpected ({resp.status_code})")
        except Exception as e:
            auth_results.append({"endpoint": path, "method": method, "error": str(e)})
            print(f"   ❌ {method} {path} - Error: {e}")

    all_results["tests"]["auth_enforcement"] = auth_results
    all_results["summary"]["total_test_suites"] += 1

    # =========================================================================
    # Test 2: SOAP Auth Enforcement
    # =========================================================================
    print("\n" + "=" * 70)
    print("📋 Test Suite 2/5: SOAP Auth Enforcement")
    print("=" * 70)

    soap_auth_results = test_soap_auth_enforcement(base_url=base_url)
    all_results["tests"]["soap_auth_enforcement"] = soap_auth_results
    all_results["summary"]["total_test_suites"] += 1

    # =========================================================================
    # Test 3: SOAP Endpoint Functionality
    # =========================================================================
    print("\n" + "=" * 70)
    print("📋 Test Suite 3/5: SOAP Endpoints")
    print("=" * 70)

    soap_results = test_soap_endpoints(
        base_url=base_url,
        api_key=api_key,
        verbose=verbose,
    )
    all_results["tests"]["soap_endpoints"] = soap_results
    all_results["summary"]["total_test_suites"] += 1

    # =========================================================================
    # Test 4: Rate Limits (if API key provided)
    # =========================================================================
    if api_key and not skip_rate_limits:
        print("\n" + "=" * 70)
        print("📋 Test Suite 4/5: Rate Limits")
        print("=" * 70)

        if rate_limit_config is None:
            rate_limit_config = RateLimitConfig()

        rate_results = test_rate_limits(
            api_key=api_key,
            base_url=base_url,
            config=rate_limit_config,
            verbose=verbose,
        )
        all_results["tests"]["rate_limits"] = rate_results
        all_results["summary"]["total_test_suites"] += 1
    else:
        if skip_rate_limits:
            print("\n📋 Test Suite 4/5: Rate Limits - SKIPPED (--skip-rate-limits)")
        else:
            print("\n📋 Test Suite 4/5: Rate Limits - SKIPPED (no API key)")
        all_results["tests"]["rate_limits"] = {"skipped": True, "reason": "No API key or --skip-rate-limits"}

    # =========================================================================
    # Test 5: Endpoint Validation
    # =========================================================================
    print("\n" + "=" * 70)
    print("📋 Test Suite 5/5: Endpoint Validation")
    print("=" * 70)

    tester = EndpointTester(
        base_url=base_url,
        api_key=api_key,
        jwt_token=jwt_token,
        verbose=verbose,
    )
    tester.run_all_tests()
    all_results["tests"]["endpoints"] = {
        "results": tester.results,
        "passed": sum(1 for r in tester.results if r["success"]),
        "failed": sum(1 for r in tester.results if not r["success"] and not r["skipped"]),
        "skipped": sum(1 for r in tester.results if r["skipped"]),
    }
    all_results["summary"]["total_test_suites"] += 1

    # =========================================================================
    # Final Summary
    # =========================================================================
    print("\n" + "=" * 70)
    print("🏁 ALL TESTS COMPLETE")
    print("=" * 70)
    print(f"\n   Total Test Suites Run: {all_results['summary']['total_test_suites']}")

    # Calculate overall pass/fail
    endpoint_failed = all_results["tests"]["endpoints"]["failed"]
    auth_issues = sum(
        1 for r in auth_results
        if r.get("expected_auth") and not r.get("auth_enforced") and not r.get("error")
    )
    soap_auth_issues = sum(
        1 for t in soap_auth_results.get("tests", [])
        if t.get("auth_enforced")
    )

    if endpoint_failed == 0 and auth_issues == 0:
        print("   ✅ All critical tests passed!")
        all_results["summary"]["overall_status"] = "PASSED"
    else:
        print(f"   ⚠️  Issues found:")
        if endpoint_failed > 0:
            print(f"      - {endpoint_failed} endpoint test(s) failed")
        if auth_issues > 0:
            print(f"      - {auth_issues} endpoint(s) missing auth enforcement")
        if soap_auth_issues > 0:
            print(f"      - {soap_auth_issues} SOAP endpoint(s) have unexpected auth")
        all_results["summary"]["overall_status"] = "ISSUES_FOUND"

    print("=" * 70 + "\n")

    # Export results if output file specified
    if output_file:
        with open(output_file, "w") as f:
            json.dump(all_results, f, indent=2, default=str)
        print(f"📄 All results exported to: {output_file}\n")

    return all_results


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Test Simpler.Grants.gov API endpoints",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Test public endpoints only (no auth)
  python test_dev_endpoints.py

  # Test with API key for authenticated endpoints
  python test_dev_endpoints.py --api-key YOUR_API_KEY

  # Test auth enforcement (checks 401/403 without credentials)
  python test_dev_endpoints.py --test-auth-enforcement

  # Test rate limits (requires API key)
  python test_dev_endpoints.py --test-rate-limits --api-key YOUR_API_KEY

  # Test rate limits with verbose output and custom limits
  python test_dev_endpoints.py --test-rate-limits --api-key YOUR_API_KEY -v \\
      --rate-limit 10 --burst-limit 15

  # Test SOAP proxy endpoints
  python test_dev_endpoints.py --test-soap

  # Test SOAP auth enforcement specifically
  python test_dev_endpoints.py --test-soap-auth

  # Run ALL tests and output to a single JSON file
  python test_dev_endpoints.py --test-all --api-key YOUR_API_KEY -o all_results.json

  # Verbose output with results export
  python test_dev_endpoints.py --api-key YOUR_API_KEY --verbose --output results.json
        """,
    )

    parser.add_argument(
        "--api-key",
        type=str,
        help="API key for authenticated endpoints",
    )
    parser.add_argument(
        "--jwt-token",
        type=str,
        help="JWT token for user-authenticated endpoints",
    )
    parser.add_argument(
        "--base-url",
        type=str,
        default=BASE_URL,
        help=f"Base URL for the API (default: {BASE_URL})",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable verbose output",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        help="Export results to JSON file",
    )
    parser.add_argument(
        "--test-all",
        action="store_true",
        help="Run ALL tests (endpoints, auth, SOAP, rate limits) and output to single JSON",
    )
    parser.add_argument(
        "--test-auth-enforcement",
        action="store_true",
        help="Test that auth enforcement is working (sends requests without credentials)",
    )
    parser.add_argument(
        "--test-rate-limits",
        action="store_true",
        help="Test API Gateway rate limiting (requires --api-key)",
    )
    parser.add_argument(
        "--rate-limit",
        type=int,
        default=10,
        help="Expected rate limit in requests/second (default: 10)",
    )
    parser.add_argument(
        "--burst-limit",
        type=int,
        default=15,
        help="Expected burst limit (default: 15)",
    )
    parser.add_argument(
        "--monthly-quota",
        type=int,
        default=250000,
        help="Expected monthly quota (default: 250000)",
    )
    parser.add_argument(
        "--test-soap",
        action="store_true",
        help="Test legacy SOAP API proxy endpoints",
    )
    parser.add_argument(
        "--test-soap-auth",
        action="store_true",
        help="Test SOAP endpoint auth enforcement (should NOT require API Gateway auth)",
    )
    parser.add_argument(
        "--skip-rate-limits",
        action="store_true",
        help="Skip rate limit tests when using --test-all (useful to avoid hitting limits)",
    )

    args = parser.parse_args()

    # Run all tests if requested
    if args.test_all:
        run_all_tests(
            base_url=args.base_url,
            api_key=args.api_key,
            jwt_token=args.jwt_token,
            verbose=args.verbose,
            output_file=args.output,
            rate_limit_config=RateLimitConfig(
                rate_limit=args.rate_limit,
                burst_limit=args.burst_limit,
                monthly_quota=args.monthly_quota,
            ),
            skip_rate_limits=args.skip_rate_limits,
        )
        return

    # Test auth enforcement if requested
    if args.test_auth_enforcement:
        test_auth_enforcement()
        return

    # Test SOAP auth enforcement if requested
    if args.test_soap_auth:
        results = test_soap_auth_enforcement(base_url=args.base_url)
        if args.output:
            with open(args.output, "w") as f:
                json.dump(results, f, indent=2)
            print(f"📄 Results exported to: {args.output}")
        return

    # Test SOAP endpoints if requested
    if args.test_soap:
        results = test_soap_endpoints(
            base_url=args.base_url,
            api_key=args.api_key,
            verbose=args.verbose,
        )
        if args.output:
            with open(args.output, "w") as f:
                json.dump(results, f, indent=2)
            print(f"📄 Results exported to: {args.output}")
        return

    # Test rate limits if requested
    if args.test_rate_limits:
        if not args.api_key:
            print("❌ Error: --api-key is required for rate limit testing")
            sys.exit(1)

        config = RateLimitConfig(
            rate_limit=args.rate_limit,
            burst_limit=args.burst_limit,
            monthly_quota=args.monthly_quota,
        )
        results = test_rate_limits(
            api_key=args.api_key,
            base_url=args.base_url,
            config=config,
            verbose=args.verbose,
        )

        if args.output:
            with open(args.output, "w") as f:
                json.dump(results, f, indent=2)
            print(f"📄 Results exported to: {args.output}")

        return

    # Run main endpoint tests
    tester = EndpointTester(
        base_url=args.base_url,
        api_key=args.api_key,
        jwt_token=args.jwt_token,
        verbose=args.verbose,
    )

    tester.run_all_tests()

    if args.output:
        tester.export_results(args.output)

    # Exit with error code if any tests failed
    failed_count = sum(
        1 for r in tester.results if not r["success"] and not r["skipped"]
    )
    sys.exit(1 if failed_count > 0 else 0)


if __name__ == "__main__":
    main()

