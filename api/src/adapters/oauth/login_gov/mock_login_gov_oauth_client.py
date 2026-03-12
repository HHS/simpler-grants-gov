from src.adapters.oauth.oauth_client import BaseOauthClient
from src.adapters.oauth.oauth_client_models import OauthTokenRequest, OauthTokenResponse


class MockLoginGovOauthClient(BaseOauthClient):

    def __init__(self) -> None:
        self.responses: dict[str, OauthTokenResponse] = {}

        # Used to control testing of retry behavior for Login.gov token lookup calls
        self.retries: dict[str, OauthTokenResponse] = {}

    def add_token_response(self, code: str, response: OauthTokenResponse) -> None:
        self.responses[code] = response

    def get_token(self, request: OauthTokenRequest) -> OauthTokenResponse:
        retries = self.retries.get(request.code)
        # if we don't have retries enabled on the mock, behave as usual
        if retries is not None:
            self.retries[request.code] = retries - 1
        # retries would be one the last time through, as we've reduced it to zero but retries accounts for the data before that
        if retries is None or retries == 1:
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
