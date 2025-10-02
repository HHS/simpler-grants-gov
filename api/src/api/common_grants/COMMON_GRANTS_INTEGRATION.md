# CommonGrants Protocol Integration

This document describes the integration of the CommonGrants Protocol into the `simpler-grants-gov` API.

## Overview

The CommonGrants Protocol provides standardized access to grant opportunity data. This integration adds three endpoints defined by the protocol to the existing API:

- `GET /common-grants/opportunities/` - List opportunities with pagination
- `GET /common-grants/opportunities/{oppId}` - Get specific opportunity by ID  
- `POST /common-grants/opportunities/search/` - Search opportunities with filters

## Architecture

### Components

- **Routes**: `src/api/common_grants/` - API endpoint definitions with dual schema support
- **Service**: `src/services/common_grants/opportunity_service.py` - Business logic wrapper
- **Transformation**: `src/services/common_grants/transformation.py` - Data mapping between formats
- **Schemas**: `src/api/common_grants/common_grants_schemas.py` - Marshmallow schemas for APIFlask
- **Dependency**: `common-grants-sdk = "~0.3.2"` - Protocol schemas and validation

### Search Integration

Both the list (`GET /common-grants/opportunities`) and search (`POST /common-grants/opportunities/search`) endpoints are **wrappers** around the existing OpenSearch infrastructure:

- **Reuses**: OpenSearch client and index used by `/v1/opportunities/search`
- **Transforms**: CommonGrants protocol requests to v1 search format
- **Delegates**: Actual search operations to `src.services.opportunities_v1.search_opportunities`
- **Transforms**: v1 search results back to CommonGrants Protocol format

This approach ensures search functionality consistency while providing the standardized CommonGrants interface.

### Data Flow

**List Endpoint:**
1. **Request** → Route handler validates input using APIFlask Marshmallow schemas
2. **Service** → `CommonGrantsOpportunityService.list_opportunities()` creates empty search request
3. **Transformation** → Converts CommonGrants request to v1 search format (with empty search term)
4. **Search Client** → Uses OpenSearch client to query indexed data via `search_opportunities()`
5. **Transformation** → Converts v1 search results back to CommonGrants format
6. **Response** → Creates Pydantic response model, converts to Marshmallow schema, returns HTTP response

**Get Endpoint:**
1. **Request** → Route handler validates UUID parameter using APIFlask
2. **Service** → `CommonGrantsOpportunityService.get_opportunity()` calls `get_opportunity()` service
3. **Transformation** → Converts Opportunity model to CommonGrants format
4. **Response** → Creates Pydantic response model, converts to Marshmallow schema, returns HTTP response

**Search Endpoint:**
1. **Request** → Route handler validates input using APIFlask Marshmallow schemas
2. **Service** → `CommonGrantsOpportunityService.search_opportunities()` processes search request
3. **Transformation** → Converts CommonGrants request to v1 search format
4. **Search Client** → Uses OpenSearch client to query indexed data via `search_opportunities()`
5. **Transformation** → Converts v1 search results back to CommonGrants format
6. **Response** → Creates Pydantic response model with sort/filter info, converts to Marshmallow schema, returns HTTP response

## Configuration

### Environment Variables

```bash
# Enable CommonGrants Protocol endpoints (defaults to false)
ENABLE_COMMON_GRANTS_ENDPOINTS=true
```

**Note**: This environment variable is set to `true` in `local.env` by default. To disable CommonGrants endpoints, change the value to `false` in your environment.

### Route Registration

The CommonGrants routes are conditionally registered in the Flask application based on the `ENABLE_COMMON_GRANTS_ENDPOINTS` environment variable:

```python
# In src/app.py
if endpoint_config.enable_common_grants_endpoints:
    app.register_blueprint(common_grants_blueprint)
```

### Dependencies

```toml
common-grants-sdk = "~0.3.2"
```

## Data Transformation

The integration uses a dual-schema approach to bridge between the CommonGrants Protocol and the existing v1 API infrastructure:

### Schema Architecture

- **Pydantic Models**: From `common-grants-sdk` for business logic and validation
- **Marshmallow Schemas**: Custom schemas in `common_grants_schemas.py` for APIFlask integration
- **Response Flow**: Pydantic models → JSON → Marshmallow validation → HTTP response

### Key Mappings

| Database Field | Protocol Field | Notes |
|---|---|---|
| `opportunity_id` | `id` | UUID format |
| `opportunity_title` | `title` | Fallback: "Untitled Opportunity" |
| `summary_description` | `description` | Fallback: "No description available" |
| `opportunity_status` | `status` | Mapped values: posted→OPEN, archived→CUSTOM, forecasted→FORECASTED, closed→CLOSED |
| `post_date` | `keyDates.postDate` | SingleDateEvent format |
| `close_date` | `keyDates.closeDate` | SingleDateEvent format |
| `estimated_total_program_funding` | `funding.totalAmountAvailable` | Money object (USD) |
| `award_ceiling` | `funding.maxAwardAmount` | Money object (USD) |
| `award_floor` | `funding.minAwardAmount` | Money object (USD) |
| `additional_info_url` | `source` | URL validation and fixing |
| `created_at` | `createdAt` | Timestamp |
| `updated_at` | `lastModifiedAt` | Timestamp |

### Database Relationships

Uses eager loading with `selectinload`:
- `Opportunity.current_opportunity_summary`
- `CurrentOpportunitySummary.opportunity_summary`

## API Endpoints

### List Opportunities

```http
GET /common-grants/opportunities?page=1&pageSize=10
```

**Features**:
- **Authentication**: Requires API key authentication
- Pagination support
- Excludes draft opportunities (`is_draft = False`)
- Orders by `lastModifiedAt` descending (default)
- Uses OpenSearch infrastructure (same as search endpoint)
- Returns `OpportunitiesListResponse`

### Get Opportunity

```http
GET /common-grants/opportunities/{oppId}
```

**Features**:
- **Authentication**: Requires API key authentication
- UUID validation
- Returns 404 if not found
- Excludes draft opportunities
- Uses `src.services.opportunities_v1.get_opportunity` service
- Returns `OpportunityResponse`

### Search Opportunities

```http
POST /common-grants/opportunities/search
```

**Features**:
- **Authentication**: Requires API key authentication
- Status filtering
- Text search across multiple fields
- Sorting
- Pagination
- **Uses OpenSearch infrastructure** - same search engine used by `/v1/opportunities/search`
- **Transforms requests/responses** between CommonGrants and v1 formats
- Returns `OpportunitiesSearchResponse`

## OpenAPI Specification Generation & Validation

The integration includes tools for generating and validating OpenAPI specifications for the CommonGrants Protocol endpoints.

### Makefile Targets

```bash
# Generate OpenAPI spec for CommonGrants routes only
make openapi-spec-common-grants

# Validate the OpenAPI spec for CommonGrants routes
make check-spec
```

### Generated Output

The script generates a YAML file (`openapi-cg.generated.yml`) containing:
- Complete OpenAPI 3.1.0 specification
- All three CommonGrants endpoints with proper schemas
- Request/response models using Marshmallow schemas
- Parameter validation and documentation

### Validation

The `make check-spec` target uses the `cg check spec` command from the CommonGrants CLI to validate the generated OpenAPI specification against the protocol requirements.

**Prerequisites**: The CommonGrants CLI tool must be installed to use the validation feature.

## Implementation Details

### Service Architecture

`CommonGrantsOpportunityService` handles:
- **List operations**: Acts as a wrapper around the v1 search infrastructure (uses OpenSearch)
- **Get operations**: Uses `src.services.opportunities_v1.get_opportunity` service with filtering and eager loading
- **Search operations**: Acts as a wrapper around the v1 search infrastructure
- Pagination and sorting logic
- Response transformation from v1 format to CommonGrants Protocol format

### Route Implementation

- Uses APIFlask decorators for dependency injection:
  - **List/Search endpoints**: `@flask_opensearch.with_search_client()` for OpenSearch client injection
  - **Get endpoint**: `@flask_db.with_db_session()` for database session injection
- **Dual Schema Approach**: 
  - Input validation uses Marshmallow schemas (`common_grants_schemas.py`)
  - Business logic uses Pydantic models (`common-grants-sdk`)
  - Response creation uses Pydantic models, then converts to Marshmallow for HTTP response
- **Error Handling**: Custom `@with_cg_error_handler()` decorator transforms CommonGrants validation errors
- Standard HTTP status codes and error responses

### Data Validation

- **Input Validation**: Marshmallow schemas ensure request data integrity
- **Business Logic**: Pydantic models from SDK provide protocol compliance
- **Response Validation**: Pydantic models → JSON → Marshmallow validation → HTTP response
- Required fields have appropriate fallbacks
- Date objects formatted for SDK compatibility
- UUID validation for opportunity IDs
- Validation errors are transformed from CommonGrants Pydantic format to application format

### Error Handling

The integration includes a custom error handler (`@with_cg_error_handler()`) that:

- **Catches ValidationError**: Transforms Pydantic validation errors to application format
- **Catches HTTPError**: Re-raises Flask HTTP errors with proper status codes
- **Catches Exceptions**: Handles unexpected errors with 500 status code
- **Logging**: Provides appropriate logging levels (info for client errors, exception for server errors)
- **Error Transformation**: Converts CommonGrants validation error format to application error format

## Known Limitations

### Current Issues

1. **Close Date Accuracy**: The close date mapping uses `summary.close_date` which may not be the correct deadline value (deadlines are stored in competitions)
2. **Sorting Accuracy**: Sorting by the updated_at or created_at timestamps might not give expected results because an opportunity is defined across multiple tables each with their own timestamps, i.e. there isn't a singular timestamp that says when an opportunity was last updated
3. **Custom Fields**: All opportunities return empty `customFields` object `{}`
4. **OpenAPI Spec Validation**: Spec validation currently fails due to the following issues:
- Implementation schema has extra property 'data' not defined in base schema
- Implementation schema has extra property 'internal_request_id' not defined in base schema
- Implementation schema has extra property 'status_code' not defined in base schema
- Missing required property 'status'

### Future Improvements

- Address close date accuracy issue
- Address sorting accuracy issue
- Add support for custom fields
- Resolve spec validation failures (likely requires change to CLI to loosen `additionalProperties` rules and allow alias for `status` property)

## Development

### Running Locally

```bash
# Install dependencies
poetry install

# Start API with data
make init 
make db-seed-local && make populate-search-opportunities
make run-logs
```

### Testing

```bash
# Run all tests (formatting, linting, migrations, tests)
make check

# Run tests only
make test

# Run tests with coverage
make test-coverage

# Run isolated tests for Common Grants routes and services
make test args="tests/src/api/common_grants -v"
make test args="tests/src/services/common_grants -v"
```

### Code Quality

```bash
# Format code
make format

# Check formatting
make format-check

# Lint code
make lint-ruff

# Type checking
make lint-mypy
```
