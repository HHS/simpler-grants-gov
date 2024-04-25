#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#

from src.db.legacy_mixin import forecast_mixin

from . import foreignbase


class Tforecast(foreignbase.ForeignBase, forecast_mixin.TforecastMixin):
    __tablename__ = "tforecast"


class TforecastHist(foreignbase.ForeignBase, forecast_mixin.TforecastHistMixin):
    __tablename__ = "tforecast_hist"


class TapplicanttypesForecast(foreignbase.ForeignBase, forecast_mixin.TapplicanttypesForecastMixin):
    __tablename__ = "tapplicanttypes_forecast"


class TapplicanttypesForecastHist(
    foreignbase.ForeignBase, forecast_mixin.TapplicanttypesForecastHistMixin
):
    __tablename__ = "tapplicanttypes_forecast_hist"


class TfundactcatForecast(foreignbase.ForeignBase, forecast_mixin.TfundactcatForecastMixin):
    __tablename__ = "tfundactcat_forecast"


class TfundactcatForecastHist(foreignbase.ForeignBase, forecast_mixin.TfundactcatForecastHistMixin):
    __tablename__ = "tfundactcat_forecast_hist"


class TfundinstrForecast(foreignbase.ForeignBase, forecast_mixin.TfundinstrForecastMixin):
    __tablename__ = "tfundinstr_forecast"


class TfundinstrForecastHist(foreignbase.ForeignBase, forecast_mixin.TfundinstrForecastHistMixin):
    __tablename__ = "tfundinstr_forecast_hist"
