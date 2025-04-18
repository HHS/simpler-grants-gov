# This variable is configured in local.env in the DOMAIN_VERIFICATION_CONTENT env var.
DV_FILE_NAME = "dv.txt"


def test_get_well_known_200(client):
    response = client.get(f"/.well-known/pki-validation/{DV_FILE_NAME}")
    assert response.text == "data"
    assert response.status_code == 200


def test_get_well_known_404(client):
    non_existent_file = "dne.txt"
    response = client.get("/.well-known/pki-validation/dne.txt")
    assert response.status_code == 404
    assert response.text == f"Could not find {non_existent_file}"
