# CommonGrants Protocol Integration

This document describes the integration of the CommonGrants Protocol into the `simpler-grants-gov` API.

## Overview

The CommonGrants Protocol provides standardized access to grant opportunity data. This integration adds three endpoints defined by the protocol to the existing API:

- `GET /common-grants/opportunities/` - List opportunities with pagination
- `GET /common-grants/opportunities/{oppId}` - Get specific opportunity by ID  
- `POST /common-grants/opportunities/search/` - Search opportunities with filters

## Architecture

### Components

- **Routes**: `src/api/common_grants/` - API endpoint definitions
- **Service**: `src/services/common_grants/opportunity_service.py` - Business logic
- **Transformation**: `src/services/common_grants/transformation.py` - Data mapping
- **Dependency**: `common-grants-sdk = "^0.3.1"` - Protocol schemas and validation

### Search Integration

The search endpoint (`POST /common-grants/opportunities/search`) is effectively a **wrapper** around the existing search infrastructure:

- **Reuses**: OpenSearch client and index used by `/v1/opportunities/search`
- **Transforms**: CommonGrants protocol requests to legacy search format
- **Delegates**: Actual search operations to `src.services.opportunities_v1.search_opportunities`
- **Transforms**: Legacy search results back to CommonGrants Protocol format

This approach ensures search functionality consistency while providing the standardized CommonGrants interface.

### Data Flow

**List/Get Endpoints:**
1. **Request** → Route handler validates input using APIFlask
2. **Service** → Queries database and transforms opportunity models to Protocol format
3. **Response** → Returns standardized CommonGrants Protocol response

**Search Endpoint:**
1. **Request** → Route handler validates input using APIFlask
2. **Transformation** → Converts CommonGrants request to legacy search format
3. **Search Client** → Uses OpenSearch client to query indexed data
4. **Transformation** → Converts legacy search results back to CommonGrants format
5. **Response** → Returns standardized CommonGrants Protocol response

## Configuration

### Environment Variables

```bash
# Enable CommonGrants Protocol endpoints (defaults to true)
ENABLE_COMMON_GRANTS_ENDPOINTS=true
```

**Note**: This environment variable is not set in `local.env` by default, but the application defaults to `true` when not specified.

### Dependencies

```toml
common-grants-sdk = "^0.3.1"
```

## Data Transformation

The service transforms `Opportunity` database models to CommonGrants Protocol format:

### Key Mappings

| Database Field | Protocol Field | Notes |
|---|---|---|
| `opportunity_id` | `id` | UUID format |
| `opportunity_title` | `title` | Fallback: "Untitled Opportunity" |
| `summary_description` | `description` | Fallback: "No description available" |
| `opportunity_status` | `status` | Mapped values: posted→OPEN, archived→CUSTOM, forecasted→FORECASTED, closed→CLOSED |
| `created_at` | `keyDates.postDate` | SingleDateEvent format |
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
- Pagination support
- Excludes draft opportunities (`is_draft = False`)
- Orders by `updated_at` descending
- Returns `OpportunitiesListResponse`

### Get Opportunity

```http
GET /common-grants/opportunities/{oppId}
```

**Features**:
- UUID validation
- Returns 404 if not found
- Excludes draft opportunities
- Returns `OpportunityResponse`

### Search Opportunities

```http
POST /common-grants/opportunities/search
```

**Features**:
- Status filtering
- Text search across multiple fields
- Sorting
- Pagination
- **Uses OpenSearch infrastructure** - same search engine used by `/v1/opportunities/search`
- **Transforms requests/responses** between CommonGrants and legacy formats
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
- **List/Get operations**: Database queries with filtering and eager loading
- **Search operations**: Acts as a wrapper around the legacy search infrastructure
- Pagination and sorting logic
- Error handling

### Route Implementation

- Uses APIFlask decorators for dependency injection:
  - **List/Get endpoints**: `@flask_db.with_db_session()` for database session injection
  - **Search endpoint**: `@flask_opensearch.with_search_client()` for OpenSearch client injection
- Standard HTTP status codes and error responses
- Custom error schemas for validation failures
- Real-time data transformation to convert to and from Protocol format

### Data Validation

- Marshmallow schemas ensure data integrity
- Required fields have appropriate fallbacks
- Date objects formatted for SDK compatibility
- UUID validation for opportunity IDs

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
```bash
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
make lint

# Type checking
make lint-mypy
```