from src.adapters.oauth.oauth_client import BaseOauthClient
from src.adapters.oauth.oauth_client_models import OauthTokenRequest, OauthTokenResponse


class MockFailedTokenLoginGovOauthClient(BaseOauthClient):

    def __init__(self) -> None:
        self.responses: dict[str, OauthTokenResponse] = {}
        self.token_calls = 0

    def add_token_response(self, code: str, response: OauthTokenResponse) -> None:
        self.responses[code] = response

    def get_token(self, request: OauthTokenRequest) -> OauthTokenResponse:
        if self.token_calls == 3:
            response = self.responses.get(request.code, None)

            if response is None:
                response = OauthTokenResponse(
                    error="error", error_description="default mock error description"
                )

            return response

        self.token_calls += 1
        return OauthTokenResponse(error="error", error_description="mock retry error")
