import secrets
import string


def generate_api_key_id(length: int = 25) -> str:
    alphabet = string.ascii_letters + string.digits  # a-z, A-Z, 0-9
    return "".join(secrets.choice(alphabet) for _ in range(length))
