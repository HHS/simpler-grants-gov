import os

from src.db.models.foreign.opportunity import Topportunity as FTopportunity
from src.db.models.staging.opportunity import Topportunity as STopportunity
from tests.src.db.models.factories import ForeignTopportunityFactory, StagingTopportunityFactory


def test_uploading_attachment_staging(db_session, enable_factory_create):
    opp = StagingTopportunityFactory.create(my_attachment=b"Testing saving to db")
    db_session.commit()
    db_session.expire_all()

    db_opp = (
        db_session.query(STopportunity)
        .filter(STopportunity.opportunity_id == opp.opportunity_id)
        .one_or_none()
    )

    try:
        with open("out_file.txt", "wb") as outfile:
            outfile.write(db_opp.my_attachment)

        with open("out_file.txt", "rb") as infile:
            file_content = infile.read()
            assert file_content == db_opp.my_attachment
    finally:
        # Cleanup: delete the file after verifying
        if os.path.exists("out_file.txt"):
            os.remove("out_file.txt")


def test_uploading_attachment_foreign(db_session, enable_factory_create):
    opp = ForeignTopportunityFactory.create(my_attachment=b"Testing saving to db")
    db_session.commit()
    db_session.expire_all()

    db_opp = (
        db_session.query(FTopportunity)
        .filter(FTopportunity.opportunity_id == opp.opportunity_id)
        .one_or_none()
    )

    try:
        with open("out_file.txt", "wb") as outfile:
            outfile.write(db_opp.my_attachment)

        with open("out_file.txt", "rb") as infile:
            file_content = infile.read()
            assert file_content == db_opp.my_attachment
    finally:
        # Cleanup: delete the file after verifying
        if os.path.exists("out_file.txt"):
            os.remove("out_file.txt")
