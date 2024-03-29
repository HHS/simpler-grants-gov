#
# SQLAlchemy models for foreign tables.
#
# These are defined in a separate sqlalchemy.MetaData object as they are managed differently:
#  - The tables are actually foreign tables connected to the source Oracle database in most environments.
#  - System components should not access them, except transform related components.
#  - Migrations are not used to manage creation and changes as the tables are actually defined in a different system.
#

import sqlalchemy

foreign_metadata = sqlalchemy.MetaData()

foreign_topportunity = sqlalchemy.Table(
    "foreign_topportunity",
    foreign_metadata,
    sqlalchemy.Column("opportunity_id", sqlalchemy.NUMERIC(20), nullable=False, primary_key=True),
    sqlalchemy.Column("oppnumber", sqlalchemy.VARCHAR(40)),
    sqlalchemy.Column("revision_number", sqlalchemy.NUMERIC(20)),
    sqlalchemy.Column("opptitle", sqlalchemy.VARCHAR(255)),
    sqlalchemy.Column("owningagency", sqlalchemy.VARCHAR(255)),
    sqlalchemy.Column("publisheruid", sqlalchemy.VARCHAR(255)),
    sqlalchemy.Column("listed", sqlalchemy.CHAR(1)),
    sqlalchemy.Column("oppcategory", sqlalchemy.CHAR(1)),
    sqlalchemy.Column("initial_opportunity_id", sqlalchemy.NUMERIC(20)),
    sqlalchemy.Column("modified_comments", sqlalchemy.VARCHAR(2000)),
    sqlalchemy.Column("created_date", sqlalchemy.DATE),
    sqlalchemy.Column("last_upd_date", sqlalchemy.DATE),
    sqlalchemy.Column("creator_id", sqlalchemy.VARCHAR(50)),
    sqlalchemy.Column("last_upd_id", sqlalchemy.VARCHAR(50)),
    sqlalchemy.Column("flag_2006", sqlalchemy.CHAR(1)),
    sqlalchemy.Column("category_explanation", sqlalchemy.VARCHAR(255)),
    sqlalchemy.Column("publisher_profile_id", sqlalchemy.NUMERIC(20)),
    sqlalchemy.Column("is_draft", sqlalchemy.VARCHAR(1)),
)
