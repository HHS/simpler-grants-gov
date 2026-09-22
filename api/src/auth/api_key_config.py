from pydantic import Field

from src.util.env_config import PydanticBaseEnvConfig


class ApiKeyConfig(PydanticBaseEnvConfig):
    """Configuration for the hashing of user API keys.

    The pepper is the key for the HMAC used to hash a raw API key before we
    store it. It is kept outside the database so that read access
    to the database isn't enough to brute force the stored hashes.

    The pepper is effectively permanent per environment - changing it
    invalidates every hash already stored, and those hashes can't be
    re-derived once the plaintext key is gone.
    """

    # min_length rejects a blank or truncated value, which a bare str would
    # accept - the pepper is hand-created per environment
    pepper: str = Field(alias="API_KEY_PEPPER", min_length=32, repr=False)
