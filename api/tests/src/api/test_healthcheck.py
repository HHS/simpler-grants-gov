import src.adapters.db as db


def test_get_healthcheck_200(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.get_json()["message"] == "Service healthy"


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
