from src.util.deploy_metadata import DeployMetadataConfig


def test_deploy_metadata_with_release_ref(monkeypatch):
    ref = "2024.11.27-1"
    sha = "44b954e85c4ca7e3714f9f988a919fae40ec3c98"

    monkeypatch.setenv("DEPLOY_GITHUB_REF", ref)
    monkeypatch.setenv("DEPLOY_GITHUB_SHA", sha)
    monkeypatch.setenv("DEPLOY_TIMESTAMP", "2024-12-02T21:25:18Z")

    config = DeployMetadataConfig()

    # Verify the calculated values are there
    assert config.release_notes == f"https://github.com/HHS/simpler-grants-gov/releases/tag/{ref}"
    assert config.deploy_commit == f"https://github.com/HHS/simpler-grants-gov/commit/{sha}"
    assert config.deploy_datetime_est.isoformat() == "2024-12-02T16:25:18-05:00"


def test_deploy_metadata_with_non_release_ref(monkeypatch):
    sha = "44b954e85c4ca7e3714f9f988a919fae40ec3c98"

    monkeypatch.setenv("DEPLOY_GITHUB_REF", "main")
    monkeypatch.setenv("DEPLOY_GITHUB_SHA", sha)
    monkeypatch.setenv("DEPLOY_TIMESTAMP", "2024-06-01T03:13:11Z")

    config = DeployMetadataConfig()

    # Verify the calculated values are there
    assert config.release_notes == "https://github.com/HHS/simpler-grants-gov/releases"
    assert config.deploy_commit == f"https://github.com/HHS/simpler-grants-gov/commit/{sha}"
    assert config.deploy_datetime_est.isoformat() == "2024-05-31T23:13:11-04:00"
