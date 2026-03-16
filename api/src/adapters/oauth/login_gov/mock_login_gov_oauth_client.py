from src.adapters.oauth.oauth_client import BaseOauthClient
from src.adapters.oauth.oauth_client_models import OauthTokenRequest, OauthTokenResponse


class MockLoginGovOauthClient(BaseOauthClient):

    def __init__(self) -> None:
        self.responses: dict[str, OauthTokenResponse] = {}

        # Used to control testing of retry behavior for Login.gov token lookup calls
        self.retries: dict[str, int] = {}

    def add_token_response(self, code: str, response: OauthTokenResponse, retries: int = 0) -> None:
        self.responses[code] = response
        self.retries[code] = retries

    def get_token(self, request: OauthTokenRequest) -> OauthTokenResponse:
        retries: int = self.retries.get(request.code, 0)
        # if we don't have retries enabled on the mock, behave as usual

        self.retries[request.code] = retries - 1
        # retries would be one the last time through, as we've reduced it to zero but retries accounts for the data before that
        if retries <= 1:
            response = self.responses.get(request.code, None)

            if response is None:
                response = OauthTokenResponse(
                    error="error", error_description="default mock error description"
                )

            return response

        # if we did turn on retries on the mock, do retry stuff
        return OauthTokenResponse(
            error="error", error_description="mock oauth token error description"
        )
