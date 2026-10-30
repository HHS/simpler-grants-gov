#
# SQLAlchemy foreign table model for the Oracle V_ALL_APPLICATIONS view.
#
# This is a read-only foreign table backed by Simpler's existing PostgreSQL foreign data
# wrapper (FDW) connection to the legacy EGRANTSADMIN Oracle database. No data is persisted
# in Simpler's Postgres database — the FDW queries Oracle directly at query time.
#
# Usage: query legacy.v_all_applications to count validated submissions by channel.
#

from src.db.models.foreign import foreignbase
from src.db.models.legacy_mixin.application_mixin import VAllApplicationsMixin


class VAllApplications(foreignbase.ForeignBase, VAllApplicationsMixin):
    __tablename__ = "v_all_applications"
