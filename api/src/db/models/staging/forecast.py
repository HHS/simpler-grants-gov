from sqlalchemy.orm import Mapped, relationship

from src.db.models.staging.staging_base import StagingBase, StagingParamMixin

from ..legacy_mixin import forecast_mixin
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

    @property
    def is_historical_table(self) -> bool:
        return False

    @property
    def description(self) -> str | None:
        return self.forecast_desc

    @property
    def agency_phone_number(self) -> str | None:
        return self.ac_phone


class TapplicanttypesForecast(
    StagingBase, forecast_mixin.TapplicanttypesForecastMixin, StagingParamMixin
):
    __tablename__ = "tapplicanttypes_forecast"

    forecast: Mapped[Tforecast | None] = relationship(
        Tforecast,
        primaryjoin="TapplicanttypesForecast.opportunity_id == foreign(Tforecast.opportunity_id)",
        uselist=False,
        overlaps="forecast",
    )

    @property
    def legacy_applicant_type_id(self) -> int:
        return self.at_frcst_id

    @property
    def is_forecast(self) -> bool:
        return True

    @property
    def revision_number(self) -> None:
        return None

    @property
    def is_historical_table(self) -> bool:
        return False


class TfundactcatForecast(StagingBase, forecast_mixin.TfundactcatForecastMixin, StagingParamMixin):
    __tablename__ = "tfundactcat_forecast"

    forecast: Mapped[Tforecast | None] = relationship(
        Tforecast,
        primaryjoin="TfundactcatForecast.opportunity_id == foreign(Tforecast.opportunity_id)",
        uselist=False,
        overlaps="forecast",
    )

    @property
    def legacy_funding_category_id(self) -> int:
        return self.fac_frcst_id

    @property
    def is_forecast(self) -> bool:
        return True

    @property
    def revision_number(self) -> None:
        return None

    @property
    def is_historical_table(self) -> bool:
        return False


class TfundinstrForecast(StagingBase, forecast_mixin.TfundinstrForecastMixin, StagingParamMixin):
    __tablename__ = "tfundinstr_forecast"

    forecast: Mapped[Tforecast | None] = relationship(
        Tforecast,
        primaryjoin="TfundinstrForecast.opportunity_id == foreign(Tforecast.opportunity_id)",
        uselist=False,
        overlaps="forecast",
    )

    @property
    def legacy_funding_instrument_id(self) -> int:
        return self.fi_frcst_id

    @property
    def is_forecast(self) -> bool:
        return True

    @property
    def revision_number(self) -> None:
        return None

    @property
    def is_historical_table(self) -> bool:
        return False
