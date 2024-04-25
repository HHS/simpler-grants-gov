#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#

import src.db.legacy_mixins.opportunity_mixin as opportunity_mixin

from . import foreignbase


class Topportunity(foreignbase.ForeignBase, opportunity_mixin.TopportunityMixin):
    __tablename__ = "topportunity"


class TopportunityCfda(foreignbase.ForeignBase, opportunity_mixin.TopportunityCfdaMixin):
    __tablename__ = "topportunity_cfda"
