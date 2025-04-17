def test_get_well_known_200(client):
    existing_file = "05589A9E44482CE51E7B9531194F4087.txt"
    response = client.get(f"/.well-known/pki-validation/{existing_file}")
    assert response.status_code == 200


def test_get_well_known_404(client):
    non_existent_file = "dne.txt"
    response = client.get("/.well-known/pki-validation/dne.txt")
    assert response.status_code == 404
    assert f"Could not read {non_existent_file}" in response.text
