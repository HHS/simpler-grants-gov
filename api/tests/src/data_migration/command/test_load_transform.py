import pytest

import src.data_migration.command.load_transform as load_transform_module


class FakeLoadOpportunitiesToIndex:
    def __init__(self, db_session, search_client, full_refresh):
        self.calls.append({"full_refresh": full_refresh})

    def run(self):
        pass


@pytest.fixture(autouse=True)
def _disable_job_lock(monkeypatch):
    monkeypatch.setenv("ENABLE_JOB_LOCK", "False")


@pytest.fixture
def fake_load_opportunities_to_index(monkeypatch):
    calls: list[dict] = []
    FakeLoadOpportunitiesToIndex.calls = calls
    monkeypatch.setattr(
        load_transform_module, "LoadOpportunitiesToIndex", FakeLoadOpportunitiesToIndex
    )
    return calls


def _invoke(cli_runner, *extra_args):
    return cli_runner.invoke(
        args=[
            "data-migration",
            "load-transform",
            "--no-load",
            "--no-transform",
            "--no-set-current",
            "--no-store-version",
            *extra_args,
        ]
    )


def test_sync_to_index_runs_by_default(cli_runner, fake_load_opportunities_to_index):
    result = _invoke(cli_runner)

    assert result.exit_code == 0
    assert fake_load_opportunities_to_index == [{"full_refresh": False}]


def test_no_sync_to_index_skips_the_index_step(cli_runner, fake_load_opportunities_to_index):
    result = _invoke(cli_runner, "--no-sync-to-index")

    assert result.exit_code == 0
    assert fake_load_opportunities_to_index == []
