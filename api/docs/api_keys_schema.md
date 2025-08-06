# User API Keys Schema

## Overview

The `user_api_key` table stores API keys that allow users to authenticate with the Simpler Grants API. Each user can have multiple API keys, but each API key belongs to only one user.

## Table Structure

| Column     | Type      | Constraints              | Description |
| ---------- | --------- | ------------------------ | ----------- |
| api_key_id | UUID      | PRIMARY KEY              | Unique identifier for the API key record |
| key_name   | TEXT      | NOT NULL                 | Human-readable name for the API key (e.g., "Production Key", "Development Key") |
| key_id     | TEXT      | NOT NULL                 | AWS API Gateway key identifier |
| user_id    | UUID      | NOT NULL, FK → user.user_id | Reference to the user who owns this API key |
| last_used  | TIMESTAMP | NULLABLE                 | Timestamp of when this API key was last used for authentication |
| is_active  | BOOLEAN   | NOT NULL, DEFAULT TRUE   | Whether this API key is currently active and can be used |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW()  | When this record was created |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW()  | When this record was last updated |

## Relationships

- **One-to-Many**: `User` → `UserApiKey`
  - A user can have multiple API keys
  - Each API key belongs to exactly one user
  - Cascade delete: when a user is deleted, all their API keys are also deleted

## Indexes

- `user_api_key_user_id_idx`: Index on `user_id` for efficient lookups of all API keys for a given user

## Database Model

The schema is implemented using SQLAlchemy models in `api/src/db/models/user_models.py`:

```python
class UserApiKey(ApiSchemaTable, TimestampMixin):
    """API Key table for user authentication to the API"""

    __tablename__ = "user_api_key"

    api_key_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    key_name: Mapped[str]
    key_id: Mapped[str] = mapped_column(comment="AWS API Gateway key identifier")
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("api.user.user_id"), index=True)
    last_used: Mapped[datetime | None]
    is_active: Mapped[bool] = mapped_column(default=True)

    user: Mapped[User] = relationship(User, back_populates="api_keys", uselist=False)
```

## Migration

The table is created via Alembic migration: `2025_08_06_add_user_api_key_table.py`

## Usage Examples

### Creating an API Key
```python
# Create an API key for a user
api_key = UserApiKey(
    key_name="Production API Key",
    key_id="aws-api-gateway-key-abc123",
    user_id=user.user_id,
    is_active=True
)
db_session.add(api_key)
db_session.commit()
```

### Finding User's API Keys
```python
# Get all active API keys for a user
active_keys = db_session.query(UserApiKey).filter(
    UserApiKey.user_id == user_id,
    UserApiKey.is_active == True
).all()
```

### Updating Last Used Timestamp
```python
# Update when an API key was last used
api_key.last_used = datetime.utcnow()
db_session.commit()
```

### Deactivating an API Key
```python
# Deactivate an API key instead of deleting it
api_key.is_active = False
db_session.commit()
```