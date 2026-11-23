"""Save, reload and clear the optional answer through the maintained API."""

from src.constants.lookup_constants import ApplicationFormStatus, Privilege
from src.form_schema.forms.nsf_deviation_authorization_generated import FORM
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
        {"deviation_authorization": "Authorized & <scope>\nSecond line"},
        {},
        {"deviation_authorization": "x" * 4001},
        {},
    ]:
        response = client.put(url, headers=headers, json={"application_response": data})
        assert response.status_code == 200
        db_session.refresh(af)
        assert af.application_response == data
        invalid = len(data.get("deviation_authorization", "")) > 4000
        assert bool(response.json["warnings"]) == invalid
        assert response.json["data"]["application_form_status"] == (
            ApplicationFormStatus.IN_PROGRESS if invalid else ApplicationFormStatus.COMPLETE
        )
