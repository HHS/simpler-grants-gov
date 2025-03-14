from tests.src.db.models.factories import FormFactory


def test_form_get_200(client, api_auth_token, enable_factory_create):
    form = FormFactory.create()

    resp = client.get(
        f"/alpha/forms/{form.form_id}", headers={"X-Auth": api_auth_token}
    )

    assert resp.status_code == 200

    print(resp.get_json())