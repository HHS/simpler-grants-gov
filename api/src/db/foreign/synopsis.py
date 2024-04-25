#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#

import datetime

from sqlalchemy.orm import Mapped, mapped_column

from . import foreignbase
import src.db.legacy_mixins.synopsis_mixin as synopsis_mixin


class Tsynopsis(foreignbase.ForeignBase, synopsis_mixin.TsynopsisMixin):
    __tablename__ = "tsynopsis"


class TsynopsisHist(foreignbase.ForeignBase, synopsis_mixin.TsynopsisHistMixin):
    __tablename__ = "tsynopsis_hist"


class TapplicanttypesSynopsis(foreignbase.ForeignBase, synopsis_mixin.TapplicanttypesSynopsisMixin):
    __tablename__ = "tapplicanttypes_synopsis"

class TapplicanttypesSynopsisHist(foreignbase.ForeignBase, synopsis_mixin.TapplicanttypesSynopsisHistMixin):
    __tablename__ = "tapplicanttypes_synopsis_hist"



class TfundactcatSynopsis(foreignbase.ForeignBase, synopsis_mixin.TfundactcatSynopsisMixin):
    __tablename__ = "tfundactcat_synopsis"




class TfundactcatSynopsisHist(foreignbase.ForeignBase, synopsis_mixin.TfundactcatSynopsisHistMixin):
    __tablename__ = "tfundactcat_synopsis_hist"



class TfundinstrSynopsis(foreignbase.ForeignBase, synopsis_mixin.TfundinstrSynopsisMixin):
    __tablename__ = "tfundinstr_synopsis"



class TfundinstrSynopsisHist(foreignbase.ForeignBase, synopsis_mixin.TfundinstrSynopsisHistMixin):
    __tablename__ = "tfundinstr_synopsis_hist"

