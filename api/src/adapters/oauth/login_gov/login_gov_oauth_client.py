from typing import Any

import requests

from src.adapters.oauth.oauth_client import BaseOauthClient
from src.adapters.oauth.oauth_client_models import OauthTokenRequest, OauthTokenResponse
from src.auth.login_gov_jwt_auth import LoginGovConfig, get_config


class LoginGovOauthClient(BaseOauthClient):

    def __init__(self, config: LoginGovConfig | None = None):
        if config is None:
            config = get_config()

        self.config = config
        self.session = self._build_session()

    def _build_session(self, session: requests.Session | None = None) -> requests.Session:
        """Set things on the session that should be shared between all requests"""
        if not session:
            session = requests.Session()

        session.headers.update({"Content-Type": "application/x-www-form-urlencoded"})

        return session

    def _request(self, method: str, full_url: str, **kwargs: Any) -> requests.Response:
        """Utility method for making a request with our session"""

        # By default timeout after 5 seconds
        if "timeout" not in kwargs:
            kwargs["timeout"] = 5

        return self.session.request(method, full_url, **kwargs)

    def get_token(self, request: OauthTokenRequest) -> OauthTokenResponse:
        """Query the login.gov token endpoint"""

        body = {
            "code": request.code,
            "grant_type": request.grant_type,
            "client_assertion": request.client_assertion,
            "client_assertion_type": request.client_assertion_type,
        }

        response = self._request("POST", self.config.login_gov_token_endpoint, data=body)

        return OauthTokenResponse.model_validate_json(response.text)
