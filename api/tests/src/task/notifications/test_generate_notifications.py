from datetime import timedelta


def test_via_cli(cli_runner, db_session, enable_factory_create, user):
    """Simple test that verifies we can invoke the notification task via CLI"""
    result = cli_runner.invoke(args=["task", "generate-notifications"])

    assert result.exit_code == 0
