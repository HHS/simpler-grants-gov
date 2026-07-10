def test_dummy_task(cli_runner):
    # Just a sanity check that the dummy task works
    # Will clean up later when we remove the dummy task.
    result = cli_runner.invoke(
        args=["task", "dummy-task"],
    )

    assert result.exit_code == 0
