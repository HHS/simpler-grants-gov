import analytics


def test_package_import_and_name():
    """The package should be imported and named correctly"""
    assert analytics.__name__ == "analytics"
