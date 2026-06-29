from dataclasses import dataclass

from pydantic import BaseModel


@dataclass
class OauthTokenRequest:
    """https://developers.login.gov/oidc/token/#request-parameters"""

    code: str
    client_assertion: str

    grant_type: str = "authorization_code"
    client_assertion_type: str = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"


class OauthTokenResponse(BaseModel):
    """https://developers.login.gov/oidc/token/#token-response"""

    # These fields are given defaults so we don't need None-checks
    # for them elsewhere, if the response didn't error, they have valid values
    id_token: str = ""
    access_token: str = ""
    token_type: str = ""
    expires_in: int = 0

    # These fields are only set if the response errored
    error: str | None = None
    error_description: str | None = None

    def is_error_response(self) -> bool:
        return self.error is not None
