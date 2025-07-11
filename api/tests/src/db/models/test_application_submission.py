import uuid

import src.util.file_util as file_util
from tests.src.db.models.factories import ApplicationSubmissionFactory


def test_application_submission_factory_creation(enable_factory_create, db_session):
    """Test that we can create an ApplicationSubmission using the factory"""
    submission = ApplicationSubmissionFactory.create()

    assert submission.application_submission_id is not None
    assert isinstance(submission.application_submission_id, uuid.UUID)
    assert submission.application_id is not None
    assert isinstance(submission.application_id, uuid.UUID)
    assert submission.file_location is not None
    assert submission.file_location.startswith("s3://")
    assert submission.file_location.endswith(".zip")
    assert submission.file_size_bytes is not None
    assert submission.file_size_bytes > 0
    assert submission.created_at is not None
    assert submission.updated_at is not None


def test_application_submission_with_custom_application(enable_factory_create, db_session):
    """Test that we can create an ApplicationSubmission with a specific application"""
    # Create an application first
    from tests.src.db.models.factories import ApplicationFactory

    application = ApplicationFactory.create()

    # Create a submission for that application
    submission = ApplicationSubmissionFactory.create(application=application)

    assert submission.application_id == application.application_id
    assert submission.application == application


def test_application_submission_download_path_property(enable_factory_create, db_session):
    """Test that the download_path property works correctly"""
    submission = ApplicationSubmissionFactory.create()

    # The download_path should return a string (presigned URL)
    download_path = submission.download_path
    assert isinstance(download_path, str)
    # Note: In tests, this might not be a valid presigned URL, but it should be a string


def test_application_submission_relationships(enable_factory_create, db_session):
    """Test that the relationship to Application works correctly"""
    submission = ApplicationSubmissionFactory.create()

    # Should be able to access the application through the relationship
    assert submission.application is not None
    assert submission.application.application_id == submission.application_id


def test_application_submission_file_creation(enable_factory_create, db_session, s3_config):
    """Test that the factory creates a file on S3"""

    submission = ApplicationSubmissionFactory.create()

    # Check that the file exists
    assert file_util.file_exists(submission.file_location) is True
