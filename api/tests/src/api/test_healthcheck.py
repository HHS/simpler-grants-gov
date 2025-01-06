from datetime import datetime

import src.adapters.db as db


def test_get_healthcheck_200(client, monkeypatch):
    response = client.get("/health")
    assert response.status_code == 200

    resp_json = response.get_json()
    assert resp_json["message"] == "Service healthy"

    # Verify the release info is attached
    assert resp_json["data"]["commit_sha"] is not None
    assert resp_json["data"]["commit_link"].startswith(
        "https://github.com/HHS/simpler-grants-gov/commit/"
    )
    assert resp_json["data"]["release_notes_link"].startswith(
        "https://github.com/HHS/simpler-grants-gov/releases"
    )
    assert datetime.fromisoformat(resp_json["data"]["last_deploy_time"]) is not None
    assert resp_json["data"]["deploy_whoami"] == "local-developer"


def test_get_healthcheck_503_db_bad_state(client, monkeypatch):
    # Make fetching the DB session fail
    def err_method(*args):
        raise Exception("Fake Error")

    # Mock db_session.Scalar to fail
    monkeypatch.setattr(db.Session, "scalar", err_method)

    response = client.get("/health")
    assert response.status_code == 503
    assert response.get_json()["message"] == "Service Unavailable"
    assert response.get_json()["internal_request_id"] is not None
