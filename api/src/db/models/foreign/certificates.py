from src.db.models.legacy_mixin.certificates_mixin import TcertificatesMixin

from . import foreignbase

"""
This table needs to be manually created in lower environments in order to add the strip_zeros
option to the is_selfsigned column due to null bytes being present for is_selfsigned. The
exclude columns option does not work on UPDATES so it causes errors every time an UPDATE is
attempted when there's a null byte in is_selfsigned. Since null bytes don't seem to be an
issue in production for that column we can let that be automatically generated.
Note: the first line with the ALTER is to ensure that the user running the task will have correct access
to the table.

The command:
ALTER DEFAULT PRIVILEGES IN SCHEMA legacy GRANT SELECT ON TABLES TO app;
DROP FOREIGN TABLE IF EXISTS legacy.tcertificates;
CREATE FOREIGN TABLE legacy.tcertificates (
    currentcertid TEXT OPTIONS (key 'true') NOT NULL,
    previouscertid TEXT,
    orgduns TEXT,
    orgname TEXT,
    expirationdate DATE,
    certemail TEXT NOT NULL,
    agencyid TEXT,
    requestorlname TEXT,                                                                                                                                                                                                  requestorfname TEXT,
    requestoremail TEXT,
    requestorphone TEXT,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL,
    creator_id TEXT NOT NULL,
    last_upd_date TIMESTAMP WITH TIME ZONE,
    last_upd_id TEXT,
    is_selfsigned TEXT OPTIONS (strip_zeros 'true'),
    serial_num TEXT,
    system_name TEXT
) SERVER grants OPTIONS (schema 'EGRANTSADMIN', table 'TCERTIFICATES', readonly 'true', prefetch '1000');

"""


class Tcertificates(foreignbase.ForeignBase, TcertificatesMixin):
    __tablename__ = "tcertificates"
