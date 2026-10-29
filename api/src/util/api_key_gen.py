import hashlib
import hmac
import secrets
import string


def generate_api_key_id(length: int = 25) -> str:
    alphabet = string.ascii_letters + string.digits  # a-z, A-Z, 0-9
    return "".join(secrets.choice(alphabet) for _ in range(length))


def hash_api_key_id(raw_key: str, pepper: str) -> str:
    """Keyed one-way hash of a raw API key for storage/lookup."""
    return hmac.new(pepper.encode("utf-8"), raw_key.encode("utf-8"), hashlib.sha256).hexdigest()
