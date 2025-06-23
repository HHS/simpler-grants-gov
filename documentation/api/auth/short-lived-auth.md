# Short-Lived Internal Token Authentication

## Overview

The Short-Lived Internal Token Authentication system provides a secure way to authenticate internal API requests using JWT tokens with database-backed session management. This approach is specifically designed for internal services that need temporary access tokens for PDF generation, form processing, or other internal operations.

## Key Features

- **Short-lived tokens**: Configurable expiration times for enhanced security
- **Database-backed validation**: All tokens are validated against the database
- **Reusable across forms**: Single token can be used for all forms within an application
- **JWT-based**: Uses industry-standard JWT tokens with RS256 signing
- **Revocable**: Tokens can be invalidated at any time via database flag

## Technical Implementation

### JWT Payload Structure

```json
{
  "sub": "token-uuid-here",
  "iat": 1700000000,
  "aud": "simpler-grants-api",
  "iss": "simpler-grants-api"
}
```

### Authentication Configuration

- **Scheme**: `ApiKey`
- **Header**: `X-SGG-Internal-Token`
- **Security Scheme Name**: `InternalApiJwtAuth`
- **Algorithm**: `RS256`

## API Reference

### Token Creation

```python
def create_jwt_for_internal_token(
    expires_at: datetime,
    db_session: db.Session,
    config: ApiJwtConfig | None = None,
) -> Tuple[str, ShortLivedInternalToken]:
```

**Parameters:**
- `expires_at`: When the token should expire (datetime object)
- `db_session`: Active database session
- `config`: Optional JWT configuration (uses default if not provided)

**Returns:**
- `Tuple[str, ShortLivedInternalToken]`: JWT string and database object

**Example:**
```python
from datetime import datetime, timedelta
from src.auth.internal_jwt_auth import create_jwt_for_internal_token

# Create a token that expires in 1 hour
expires_at = datetime.utcnow() + timedelta(hours=1)
jwt_token, token_object = create_jwt_for_internal_token(
    expires_at=expires_at,
    db_session=db_session
)
```

### Token Validation

```python
def parse_jwt_for_internal_token(
    token: str, 
    db_session: db.Session, 
    config: ApiJwtConfig | None = None
) -> ShortLivedInternalToken:
```

**Parameters:**
- `token`: JWT token string
- `db_session`: Active database session
- `config`: Optional JWT configuration

**Returns:**
- `ShortLivedInternalToken`: Database object if valid

**Raises:**
- `JwtValidationError`: If token is invalid, expired, or revoked

## Usage Examples

### Protecting an Endpoint

```python
from src.auth.internal_jwt_auth import internal_jwt_auth
from src.adapters.db import flask_db
from src.api import response

@example_blueprint.get("/internal-endpoint")
@example_blueprint.auth_required(internal_jwt_auth)
@flask_db.with_db_session()
def protected_endpoint(db_session: db.Session) -> response.ApiResponse:
    # Access the authenticated token
    token: ShortLivedInternalToken = internal_jwt_auth.current_user
    
    # Use token information
    token_id = token.short_lived_internal_token_id
    expires_at = token.expires_at
    
    return response.ApiResponse(
        message="Access granted",
        data={
            "token_id": str(token_id),
            "expires_at": expires_at.isoformat()
        }
    )
```

### Creating Tokens for Internal Services

```python
from datetime import datetime, timedelta
from src.auth.internal_jwt_auth import create_jwt_for_internal_token

def generate_pdf_token(db_session: db.Session) -> str:
    """Generate a token for PDF generation service"""
    # Token expires in 30 minutes
    expires_at = datetime.utcnow() + timedelta(minutes=30)
    
    jwt_token, _ = create_jwt_for_internal_token(
        expires_at=expires_at,
        db_session=db_session
    )
    
    return jwt_token
```

### Revoking Tokens

```python
def revoke_token(token_id: str, db_session: db.Session):
    """Revoke a token by setting is_valid to False"""
    token = db_session.query(ShortLivedInternalToken).filter(
        ShortLivedInternalToken.short_lived_internal_token_id == token_id
    ).first()
    
    if token:
        token.is_valid = False
        db_session.commit()
```