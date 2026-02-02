from datetime import datetime

from src.adapters.aws.sesv2_adapter import MockSESV2Client, SuppressedDestination


def test_ses_adapter():
    client = MockSESV2Client(page_size=2)

    client.add_mock_responses(
        SuppressedDestination(
            EmailAddress="bounce@simulator.amazonses.com",
            Reason="BOUNCE",
            LastUpdateTime=datetime(2020, 1, 1, 12, 0, 0),
        )
    )
    client.add_mock_responses(
        SuppressedDestination(
            EmailAddress="bounce2@simulator.amazonses.com",
            Reason="COMPLAINT",
            LastUpdateTime=datetime(2025, 1, 1, 9, 30, 0),
        )
    )

    resp = client.list_suppressed_destinations()

    assert len(resp.suppressed_destination_summaries) == 2

    assert client.mock_responses[0].email_address == "bounce@simulator.amazonses.com"
    assert client.mock_responses[0].reason == "BOUNCE"
    assert client.mock_responses[0].last_update_time == datetime(2020, 1, 1, 12, 0, 0)

    assert client.mock_responses[1].email_address == "bounce2@simulator.amazonses.com"
    assert client.mock_responses[1].reason == "COMPLAINT"
    assert client.mock_responses[1].last_update_time == datetime(2025, 1, 1, 9, 30, 0)

    resp = client.list_suppressed_destinations(start_time=datetime(2022, 1, 1))
    data = resp.suppressed_destination_summaries

    assert data[0].email_address == "bounce2@simulator.amazonses.com"
    assert data[0].reason == "COMPLAINT"
    assert data[0].last_update_time == datetime(2025, 1, 1, 9, 30, 0)
