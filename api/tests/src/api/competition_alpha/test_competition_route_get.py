import uuid

from tests.src.db.models.factories import CompetitionFactory


def test_competition_get_200(client, api_auth_token, enable_factory_create):
    competition = CompetitionFactory.create()

    resp = client.get(
        f"/alpha/competitions/{competition.competition_id}", headers={"X-Auth": api_auth_token}
    )

    assert resp.status_code == 200
    response_competition = resp.get_json()["data"]

    assert response_competition["competition_id"] == str(competition.competition_id)
    assert response_competition["opportunity_id"] == competition.opportunity_id


def test_competition_get_404_not_found(client, api_auth_token):
    competition_id = uuid.uuid4()
    resp = client.get(f"/alpha/competitions/{competition_id}", headers={"X-Auth": api_auth_token})

    assert resp.status_code == 404
    assert resp.get_json()["message"] == f"Could not find Competition with ID {competition_id}"


def test_competition_get_401_unauthorized(client, api_auth_token, enable_factory_create):
    competition = CompetitionFactory.create()

    resp = client.get(
        f"/alpha/competitions/{competition.competition_id}", headers={"X-Auth": "some-other-token"}
    )

    assert resp.status_code == 401
    assert (
        resp.get_json()["message"]
        == "The server could not verify that you are authorized to access the URL requested"
    )
