from sqlalchemy.orm import Mapped, relationship

from src.db.legacy_mixin import forecast_mixin
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin

from .opportunity import Topportunity


class Tforecast(StagingBase, forecast_mixin.TforecastMixin, StagingParamMixin):
    __tablename__ = "tforecast"

    opportunity: Mapped[Topportunity | None] = relationship(
        Topportunity,
        primaryjoin="Tforecast.opportunity_id == foreign(Topportunity.opportunity_id)",
        uselist=False,
        overlaps="opportunity",
    )

    @property
    def is_forecast(self) -> bool:
        return True


class TforecastHist(StagingBase, forecast_mixin.TforecastHistMixin, StagingParamMixin):
    __tablename__ = "tforecast_hist"

    opportunity: Mapped[Topportunity | None] = relationship(
        Topportunity,
        primaryjoin="TforecastHist.opportunity_id == foreign(Topportunity.opportunity_id)",
        uselist=False,
        overlaps="opportunity",
    )

    @property
    def is_forecast(self) -> bool:
        return True


class TapplicanttypesForecast(
    StagingBase, forecast_mixin.TapplicanttypesForecastMixin, StagingParamMixin
):
    __tablename__ = "tapplicanttypes_forecast"


    forecast: Mapped[Tforecast | None] = relationship(
        Tforecast,
        primaryjoin="TapplicanttypesForecast.opportunity_id == foreign(Tforecast.opportunity_id)",
        uselist=False,
    )

class TapplicanttypesForecastHist(
    StagingBase, forecast_mixin.TapplicanttypesForecastHistMixin, StagingParamMixin
):
    __tablename__ = "tapplicanttypes_forecast_hist"

    forecast: Mapped[TforecastHist | None] = relationship(
        TforecastHist,
        primaryjoin="and_(TapplicanttypesForecastHist.opportunity_id == foreign(TforecastHist.opportunity_id), TapplicanttypesForecastHist.revision_number == foreign(TforecastHist.revision_number))",
        uselist=False,
    )

class TfundactcatForecast(StagingBase, forecast_mixin.TfundactcatForecastMixin, StagingParamMixin):
    __tablename__ = "tfundactcat_forecast"

    forecast: Mapped[Tforecast | None] = relationship(
        Tforecast,
        primaryjoin="TfundactcatForecast.opportunity_id == foreign(Tforecast.opportunity_id)",
        uselist=False,
    )

class TfundactcatForecastHist(
    StagingBase, forecast_mixin.TfundactcatForecastHistMixin, StagingParamMixin
):
    __tablename__ = "tfundactcat_forecast_hist"

    forecast: Mapped[TforecastHist | None] = relationship(
        TforecastHist,
        primaryjoin="and_(TfundactcatForecastHist.opportunity_id == foreign(TforecastHist.opportunity_id), TfundactcatForecastHist.revision_number == foreign(TforecastHist.revision_number))",
        uselist=False,
    )

class TfundinstrForecast(StagingBase, forecast_mixin.TfundinstrForecastMixin, StagingParamMixin):
    __tablename__ = "tfundinstr_forecast"

    forecast: Mapped[Tforecast | None] = relationship(
        Tforecast,
        primaryjoin="TfundinstrForecast.opportunity_id == foreign(Tforecast.opportunity_id)",
        uselist=False,
    )

class TfundinstrForecastHist(
    StagingBase, forecast_mixin.TfundinstrForecastHistMixin, StagingParamMixin
):
    __tablename__ = "tfundinstr_forecast_hist"

    forecast: Mapped[TforecastHist | None] = relationship(
        TforecastHist,
        primaryjoin="and_(TfundinstrForecastHist.opportunity_id == foreign(TforecastHist.opportunity_id), TfundinstrForecastHist.revision_number == foreign(TforecastHist.revision_number))",
        uselist=False,
    )
