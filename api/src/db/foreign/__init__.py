#
# SQLAlchemy models for foreign tables.
#
# These are defined in a separate sqlalchemy.MetaData object as they are managed differently:
#  - The tables are actually foreign tables connected to the source Oracle database in most environments.
#  - System components should not access them, except transform related components.
#  - Migrations are not used to manage creation and changes as the tables are actually defined in a different system.
#

from typing import Any, Iterable

import sqlalchemy
from sqlalchemy.orm import mapped_column

foreign_metadata = sqlalchemy.MetaData()


class Base(sqlalchemy.orm.DeclarativeBase):
    metadata = foreign_metadata

    def _dict(self) -> dict:
        return {c.key: getattr(self, c.key) for c in sqlalchemy.inspect(self).mapper.column_attrs}

    def __repr__(self) -> str:
        return f"<{type(self).__name__}({self._dict()!r})"

    def __rich_repr__(self) -> Iterable[tuple[str, Any]]:
        """Rich repr for interactive console.

        See https://rich.readthedocs.io/en/latest/pretty.html#rich-repr-protocol
        """
        return self._dict().items()


class ForeignTopportunity(Base):
    __tablename__ = "foreign_topportunity"

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
