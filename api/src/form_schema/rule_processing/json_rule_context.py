import copy
from dataclasses import dataclass

from src.api.response import ValidationErrorDetail
from src.db.models.competition_models import ApplicationForm
from src.db.models.opportunity_models import Opportunity


@dataclass
class JsonRuleConfig:
    """Configuration class params for which parts of the JSON rules to do"""

    do_pre_population: bool = True
    do_post_population: bool = True
    do_field_validation: bool = True


class JsonRuleContext:

    def __init__(self, application_form: ApplicationForm, config: JsonRuleConfig):
        self.application_form = application_form
        self.config = config

        # We create a copy of the json answers, just in case there
        # is any problem we won't immediately change the answer in the DB
        self.json_data = copy.deepcopy(self.application_form.application_response)

        self.validation_issues: list[ValidationErrorDetail] = []

    @property
    def opportunity(self) -> Opportunity:
        """Property getter for the opportunity, just because that's a really long path"""
        # None of these are nullable, so this is safe
        return self.application_form.application.competition.opportunity

    def get_log_context(self) -> dict:
        return {
            "application_form_id": self.application_form.application_form_id,
            "form_id": self.application_form.form_id,
        }
