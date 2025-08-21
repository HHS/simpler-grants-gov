# CommonGrants Protocol Integration

This document describes the integration of the CommonGrants Protocol into the `simpler-grants-gov` API.

## Overview

The CommonGrants Protocol provides a standardized way to access grant opportunity data across different systems. This integration adds three new endpoints to the existing API:

1. `GET /common-grants/opportunities/` - List opportunities with pagination
2. `GET /common-grants/opportunities/{oppId}` - Get a specific opportunity by ID
3. `POST /common-grants/opportunities/search/` - Search opportunities with filters

## Architecture

### Components

- **Blueprint**: `src/api/common_grants/` - Contains the route definitions and API documentation
- **Service Layer**: `src/services/common_grants/` - Contains business logic and data transformation
- **Dependencies**: CommonGrants Python SDK for schemas and validation

### Data Flow

1. **Request** → Route handler validates input using APIFlask decorators
2. **Service** → Transforms database models to CommonGrants format
3. **Response** → Returns standardized CommonGrants Protocol response

## Configuration

### Environment Variables

```bash
# Enable CommonGrants Protocol endpoints (defaults to true)
ENABLE_COMMON_GRANTS_ENDPOINTS=true
```

### Dependencies

The integration requires the CommonGrants Python SDK from PyPI:

```toml
common-grants-sdk = "^0.2.2"
```

## Data Transformation

The service layer transforms existing `Opportunity` database models to the CommonGrants Protocol format:

### Key Mappings

- **ID**: `opportunity_id`
- **Description**: `current_opportunity_summary.opportunity_summary.summary_description`
- **Status**: Mapped from `opportunity_status` enum values:
  - "posted" → `OppStatusOptions.OPEN`
  - "archived" → `OppStatusOptions.CUSTOM`
  - "forecasted" → `OppStatusOptions.FORECASTED`
  - "closed" → `OppStatusOptions.CLOSED`
- **Timeline** (`key_dates`):
  - `post_date`: `created_at` as `SingleDateEvent`
  - `close_date`: `current_opportunity_summary.opportunity_summary.close_date` as `SingleDateEvent`
- **Funding**:
  - `totalAmountAvailable`: `current_opportunity_summary.opportunity_summary.estimated_total_program_funding`
  - `maxAwardAmount`: `current_opportunity_summary.opportunity_summary.award_ceiling`
  - `minAwardAmount`: `current_opportunity_summary.opportunity_summary.award_floor`
- **Metadata**:
  - `created_at`: `created_at` timestamp
  - `last_modified_at`: `updated_at` timestamp
- **Source**: `current_opportunity_summary.opportunity_summary.additional_info_url`

### Database Relationships

The service uses eager loading with `selectinload` to efficiently load nested relationships:
- `Opportunity.current_opportunity_summary`
- `CurrentOpportunitySummary.opportunity_summary`

## API Endpoints

### List Opportunities

```http
GET /common-grants/opportunities?page=1&pageSize=10
```

**Response**: `OpportunitiesListResponse` with paginated list of opportunities

**Features**:
- Pagination support
- Excludes draft opportunities (`is_draft = False`)
- Orders by `updated_at` descending

### Get Opportunity

```http
GET /common-grants/opportunities/{oppId}
```

**Response**: `OpportunityResponse` with single opportunity details

**Features**:
- UUID validation
- Returns 404 if opportunity not found
- Excludes draft opportunities

### Search Opportunities

```http
POST /common-grants/opportunities/search
Content-Type: application/json

{
  "filters": {
    "status": {
      "operator": "in",
      "value": ["open"]
    }
  },
  "sorting": {
    "sortBy": "lastModifiedAt",
    "sortOrder": "desc"
  },
  "pagination": {
    "page": 1,
    "pageSize": 10
  },
  "search": "research"
}
```

**Response**: `OpportunitiesSearchResponse` with filtered and sorted results

**Features**:
- Status filtering
- Text search across opportunity titles only
- Sorting by title, last modified date, or close date
- Pagination support

## Implementation Details

### Service Architecture

The `CommonGrantsOpportunityService` class handles:
- Database queries with proper filtering and eager loading
- Data transformation from SQLAlchemy models to CommonGrants schemas
- Pagination and sorting logic
- Error handling for missing data

### Route Implementation

Routes use APIFlask decorators:
- `@flask_db.with_db_session()` for database session injection
- Standard HTTP status codes
- Proper error responses with descriptive messages

### Data Validation

- Pydantic models ensure data integrity
- Required fields have appropriate fallbacks
- Date objects are properly formatted for the SDK
- UUID validation for opportunity IDs
- Money objects are created with proper currency (USD) and string amounts
- URL validation and fixing

## Development

### Running Locally

1. Install dependencies:
   ```bash
   poetry install
   ```

2. Start the API:
   ```bash
   make init 
   make db-seed-local && make populate-search-opportunities
   make run-logs
   ```

### Testing

Run automated checks and tests:
   ```bash
   make check
   ```
