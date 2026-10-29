#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#
from sqlalchemy.orm import Mapped, foreign, relationship

from ..legacy_mixin import forecast_mixin
from . import foreignbase
from .opportunity import Topportunity


class Tforecast(foreignbase.ForeignBase, forecast_mixin.TforecastMixin):
    __tablename__ = "tforecast"

    opportunity: Mapped[Topportunity | None] = relationship(
        Topportunity,
        primaryjoin=lambda: Tforecast.opportunity_id == foreign(Topportunity.opportunity_id),
        uselist=False,
        overlaps="opportunity",
    )


class TapplicanttypesForecast(foreignbase.ForeignBase, forecast_mixin.TapplicanttypesForecastMixin):
    __tablename__ = "tapplicanttypes_forecast"

    forecast: Mapped[Tforecast | None] = relationship(
        Tforecast,
        primaryjoin=lambda: TapplicanttypesForecast.opportunity_id
        == foreign(Tforecast.opportunity_id),
        uselist=False,
        overlaps="forecast",
    )


class TfundactcatForecast(foreignbase.ForeignBase, forecast_mixin.TfundactcatForecastMixin):
    __tablename__ = "tfundactcat_forecast"

    forecast: Mapped[Tforecast | None] = relationship(
        Tforecast,
        primaryjoin=lambda: TfundactcatForecast.opportunity_id == foreign(Tforecast.opportunity_id),
        uselist=False,
        overlaps="forecast",
    )


class TfundinstrForecast(foreignbase.ForeignBase, forecast_mixin.TfundinstrForecastMixin):
    __tablename__ = "tfundinstr_forecast"

    forecast: Mapped[Tforecast | None] = relationship(
        Tforecast,
        primaryjoin=lambda: TfundinstrForecast.opportunity_id == foreign(Tforecast.opportunity_id),
        uselist=False,
        overlaps="forecast",
    )
