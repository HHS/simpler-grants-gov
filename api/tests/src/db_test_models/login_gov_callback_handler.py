from src.services.users.login_gov_callback_handler_base import AbstractLoginGovCallbackHandler


class LoginGovCallbackHandler(AbstractLoginGovCallbackHandler):
    """Applicant-side login.gov callback handler."""

    def handle_post_login(self, user, is_user_new, login_gov_user):
        """Nothing needed for post login for testing"""
