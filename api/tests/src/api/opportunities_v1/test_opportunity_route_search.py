from tests.src.api.opportunities_v1.conftest import get_search_request


def test_opportunity_route_search_200(client, api_auth_token):
    req = get_search_request()

    resp = client.post("/v1/opportunities/search", json=req, headers={"X-Auth": api_auth_token})

    assert resp.status_code == 200

    # The endpoint meaningfully only returns the pagination params back
    # at the moment, so just validate that for now.
    resp_body = resp.get_json()
    assert resp_body["pagination_info"]["page_offset"] == req["pagination"]["page_offset"]
    assert resp_body["pagination_info"]["page_size"] == req["pagination"]["page_size"]
    assert resp_body["pagination_info"]["sort_direction"] == req["pagination"]["sort_direction"]
    assert resp_body["pagination_info"]["order_by"] == req["pagination"]["order_by"]
    assert resp_body["pagination_info"]["total_records"] == 0
    assert resp_body["pagination_info"]["total_pages"] == 0
