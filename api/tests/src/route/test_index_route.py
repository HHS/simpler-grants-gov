def test_get_index_200(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "<h1>Home</h1>" in response.text
