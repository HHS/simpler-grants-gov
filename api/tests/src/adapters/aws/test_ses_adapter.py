from datetime import datetime

from src.adapters.aws.ses_adapter import MockSESV2Client, SuppressedDestination


def test_ses_adapter():
    client = MockSESV2Client()

    client.add_mock_responses(
        SuppressedDestination(
            EmailAddress="bounce@simulator.amazonses.com",
            Reason="BOUNCE",
            LastUpdateTime=datetime(2020, 1, 1),
        )
    )
    client.add_mock_responses(
        SuppressedDestination(
            EmailAddress="bounce2@simulator.amazonses.com",
            Reason="COMPLAINT",
            LastUpdateTime=datetime(2025, 1, 1),
        )
    )

    resp = client.list_suppressed_destinations()

    assert len(resp["SuppressedDestinationSummaries"]) == 2

    assert client.mock_responses[0].email_address == "bounce@simulator.amazonses.com"
    assert client.mock_responses[0].reason == "BOUNCE"
    assert client.mock_responses[0].last_update_time == datetime(2020, 1, 1)

    assert client.mock_responses[1].email_address == "bounce2@simulator.amazonses.com"
    assert client.mock_responses[1].reason == "COMPLAINT"
    assert client.mock_responses[1].last_update_time == datetime(2025, 1, 1)

    resp = client.list_suppressed_destinations(start_date=datetime(2022, 1, 1))
    data = resp["SuppressedDestinationSummaries"]

    assert data[0]["EmailAddress"] == "bounce2@simulator.amazonses.com"
    assert data[0]["Reason"] == "COMPLAINT"
    assert data[0]["LastUpdateTime"] == datetime(2025, 1, 1)
