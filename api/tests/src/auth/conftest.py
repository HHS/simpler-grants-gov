import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa


def _generate_rsa_key_pair():
    # Rather than define a private/public key, generate one for the tests
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    private_key = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    )

    public_key = key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM, format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

    return private_key, public_key


@pytest.fixture(scope="session")
def rsa_key_pair():
    return _generate_rsa_key_pair()


@pytest.fixture(scope="session")
def private_rsa_key(rsa_key_pair):
    return rsa_key_pair[0]


@pytest.fixture(scope="session")
def public_rsa_key(rsa_key_pair):
    return rsa_key_pair[1]


@pytest.fixture(scope="session")
def other_rsa_key_pair():
    return _generate_rsa_key_pair()
