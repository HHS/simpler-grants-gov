from src.app_config import AppConfig


def test_flask_max_content_length_configuration(app):
    """Test that the Flask app is configured with the correct MAX_CONTENT_LENGTH."""
    app_config = AppConfig()

    # Verify that Flask's MAX_CONTENT_LENGTH is set to the app config value
    assert app.config["MAX_CONTENT_LENGTH"] == app_config.max_file_upload_size_bytes

    # Verify the value is 2GB (2 * 1024^3 bytes)
    expected_size = 2 * 1024 * 1024 * 1024
    assert app.config["MAX_CONTENT_LENGTH"] == expected_size
