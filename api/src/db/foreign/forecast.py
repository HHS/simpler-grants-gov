#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#
from sqlalchemy import and_
from sqlalchemy.orm import Mapped, foreign, relationship

from src.db.legacy_mixin import forecast_mixin

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


class TforecastHist(foreignbase.ForeignBase, forecast_mixin.TforecastHistMixin):
    __tablename__ = "tforecast_hist"

    opportunity: Mapped[Topportunity | None] = relationship(
        Topportunity,
        primaryjoin=lambda: TforecastHist.opportunity_id == foreign(Topportunity.opportunity_id),
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


class TapplicanttypesForecastHist(
    foreignbase.ForeignBase, forecast_mixin.TapplicanttypesForecastHistMixin
):
    __tablename__ = "tapplicanttypes_forecast_hist"

    forecast: Mapped[TforecastHist | None] = relationship(
        TforecastHist,
        primaryjoin=lambda: and_(
            TapplicanttypesForecastHist.opportunity_id == foreign(TforecastHist.opportunity_id),
            TapplicanttypesForecastHist.revision_number == foreign(TforecastHist.revision_number),
        ),
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


class TfundactcatForecastHist(foreignbase.ForeignBase, forecast_mixin.TfundactcatForecastHistMixin):
    __tablename__ = "tfundactcat_forecast_hist"

    forecast: Mapped[TforecastHist | None] = relationship(
        TforecastHist,
        primaryjoin=lambda: and_(
            TfundactcatForecastHist.opportunity_id == foreign(TforecastHist.opportunity_id),
            TfundactcatForecastHist.revision_number == foreign(TforecastHist.revision_number),
        ),
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


class TfundinstrForecastHist(foreignbase.ForeignBase, forecast_mixin.TfundinstrForecastHistMixin):
    __tablename__ = "tfundinstr_forecast_hist"

    forecast: Mapped[TforecastHist | None] = relationship(
        TforecastHist,
        primaryjoin=lambda: and_(
            TfundinstrForecastHist.opportunity_id == foreign(TforecastHist.opportunity_id),
            TfundinstrForecastHist.revision_number == foreign(TforecastHist.revision_number),
        ),
        uselist=False,
        overlaps="forecast",
    )
