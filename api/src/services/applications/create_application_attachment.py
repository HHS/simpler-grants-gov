from src.db.models.competition_models import ApplicationAttachment
import src.adapters.db as db
import uuid
from werkzeug.utils import secure_filename
from src.db.models.user_models import User
from src.services.applications.get_application import get_application


def create_application_attachment(db_session: db.Session, application_id: uuid.UUID, user: User, form_and_files_data: dict) -> ApplicationAttachment:
    # Fetch the application - handles checking if application exists & user can access
    application = get_application(db_session, application_id, user)

    # TODO - need to test
    # * What we get on the file object
    # * How well this works with our file util
    # *

    print(form_and_files_data)

    file_name = secure_filename("TODO")

    # Build the s3 path

    application_attachment = ApplicationAttachment(
        application_attachment_id=uuid.uuid4(),
        application=application,
        file_location="TODO",
        file_name=file_name,
        mime_type="TODO",
        file_size_bytes=1, # TODO - also make this a biginteger column
    )

    return application_attachment
