"""Save, reload and clear the optional reviewer lists through the API."""

from src.constants.lookup_constants import ApplicationFormStatus, Privilege
from src.form_schema.forms.nsf_suggested_reviewers_generated import FORM
from tests.lib.application_test_utils import create_user_in_app
from tests.src.db.models.factories import ApplicationFormFactory, CompetitionFormFactory


def test_save_clear_and_validation(client, enable_factory_create, seed_form_registry, db_session):
    _, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    cf = CompetitionFormFactory.create(competition=application.competition, form=FORM)
    af = ApplicationFormFactory.create(
        application=application, competition_form=cf, application_response={}
    )
    url = f"/alpha/applications/{application.application_id}/forms/{FORM.form_id}"
    headers = {"X-SGG-Token": token}
    for data in [
        {
            "suggested_reviewers": '"Dr. Ada Example" & <B>\nSecond line',
            "reviewers_not_to_include": "null",
        },
        {"reviewers_not_to_include": "Dr. Ben Example; recent collaborator."},
        {},
        {"suggested_reviewers": "x" * 4001},
        {},
    ]:
        response = client.put(url, headers=headers, json={"application_response": data})
        assert response.status_code == 200
        db_session.refresh(af)
        assert af.application_response == data
        invalid = len(data.get("suggested_reviewers", "")) > 4000
        assert bool(response.json["warnings"]) == invalid
        assert response.json["data"]["application_form_status"] == (
            ApplicationFormStatus.IN_PROGRESS if invalid else ApplicationFormStatus.COMPLETE
        )
