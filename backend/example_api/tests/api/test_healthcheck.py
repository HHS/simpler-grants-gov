import apiflask
import grants_shared

def test_thing(client):
    response = client.get("/health")

    assert response.status_code == 200
    print(response.json)