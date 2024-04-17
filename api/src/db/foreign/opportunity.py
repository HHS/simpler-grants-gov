#
# SQLAlchemy models for foreign tables.
#

import sqlalchemy
from sqlalchemy.orm import mapped_column

from . import base


class Topportunity(base.Base):
    __tablename__ = "topportunity"

    opportunity_id = mapped_column(sqlalchemy.NUMERIC(20), nullable=False, primary_key=True)
    oppnumber = mapped_column(sqlalchemy.VARCHAR(40))
    revision_number = mapped_column(sqlalchemy.NUMERIC(20))
    opptitle = mapped_column(sqlalchemy.VARCHAR(255))
    owningagency = mapped_column(sqlalchemy.VARCHAR(255))
    publisheruid = mapped_column(sqlalchemy.VARCHAR(255))
    listed = mapped_column(sqlalchemy.CHAR(1))
    oppcategory = mapped_column(sqlalchemy.CHAR(1))
    initial_opportunity_id = mapped_column(sqlalchemy.NUMERIC(20))
    modified_comments = mapped_column(sqlalchemy.VARCHAR(2000))
    created_date = mapped_column(sqlalchemy.DATE)
    last_upd_date = mapped_column(sqlalchemy.DATE)
    creator_id = mapped_column(sqlalchemy.VARCHAR(50))
    last_upd_id = mapped_column(sqlalchemy.VARCHAR(50))
    flag_2006 = mapped_column(sqlalchemy.CHAR(1))
    category_explanation = mapped_column(sqlalchemy.VARCHAR(255))
    publisher_profile_id = mapped_column(sqlalchemy.NUMERIC(20))
    is_draft = mapped_column(sqlalchemy.VARCHAR(1))
