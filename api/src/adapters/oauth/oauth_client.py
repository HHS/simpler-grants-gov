import abc

from src.adapters.oauth.oauth_client_models import OauthTokenRequest, OauthTokenResponse


class BaseOauthClient(abc.ABC, metaclass=abc.ABCMeta):

    @abc.abstractmethod
    def get_token(self, request: OauthTokenRequest) -> OauthTokenResponse:
        """Call the POST token endpoint

        See: https://developers.login.gov/oidc/token/
        """
        pass
