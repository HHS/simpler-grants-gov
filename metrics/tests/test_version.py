import metrics


def test_package_import_and_name():
    """The package should be imported and named correctly"""
    assert metrics.__name__ == "metrics"
