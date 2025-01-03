from src.db.models.foreign.attachment import TsynopsisAttachment as TsynopsisAttachmentF
from src.db.models.staging.attachment import TsynopsisAttachment as TsynopsisAttachmentS
from tests.src.db.models.factories import (
    ForeignTsynopsisAttachmentFactory,
    StagingTsynopsisAttachmentFactory,
)


def test_uploading_attachment_staging(db_session, enable_factory_create, tmp_path):
    att = StagingTsynopsisAttachmentFactory.create(my_attachment=b"Testing saving to db")
    db_session.commit()
    db_session.expire_all()

    db_att = (
        db_session.query(TsynopsisAttachmentS)
        .filter(TsynopsisAttachmentS.opportunity_id == att.opportunity_id)
        .one_or_none()
    )
    temp_file = tmp_path / "out_file.txt"
    temp_file.write_bytes(db_att.my_attachment)
    file_content = temp_file.read_bytes()

    assert file_content == db_att.my_attachment


def test_uploading_attachment_foreign(db_session, enable_factory_create, tmp_path):
    att = ForeignTsynopsisAttachmentFactory.create(my_attachment=b"Testing saving to db")
    db_session.commit()
    db_session.expire_all()

    db_att = (
        db_session.query(TsynopsisAttachmentF)
        .filter(TsynopsisAttachmentF.opportunity_id == att.opportunity_id)
        .one_or_none()
    )

    temp_file = tmp_path / "out_file.txt"
    temp_file.write_bytes(db_att.my_attachment)
    file_content = temp_file.read_bytes()

    assert file_content == db_att.my_attachment
