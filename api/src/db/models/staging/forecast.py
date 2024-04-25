import src.db.legacy_mixins.forecast_mixin as forecast_mixin
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin


class Tforecast(StagingBase, forecast_mixin.TforecastMixin, StagingParamMixin):
    __tablename__ = "tforecast"


class TforecastHist(StagingBase, forecast_mixin.TforecastHistMixin, StagingParamMixin):
    __tablename__ = "tforecast_hist"


class TapplicanttypesForecast(
    StagingBase, forecast_mixin.TapplicanttypesForecastMixin, StagingParamMixin
):
    __tablename__ = "tapplicanttypes_forecast"


class TapplicanttypesForecastHist(
    StagingBase, forecast_mixin.TapplicanttypesForecastHistMixin, StagingParamMixin
):
    __tablename__ = "tapplicanttypes_forecast_hist"


class TfundactcatForecast(StagingBase, forecast_mixin.TfundactcatForecastMixin, StagingParamMixin):
    __tablename__ = "tfundactcat_forecast"


class TfundactcatForecastHist(
    StagingBase, forecast_mixin.TfundactcatForecastHistMixin, StagingParamMixin
):
    __tablename__ = "tfundactcat_forecast_hist"


class TfundinstrForecast(StagingBase, forecast_mixin.TfundinstrForecastMixin, StagingParamMixin):
    __tablename__ = "tfundinstr_forecast"


class TfundinstrForecastHist(
    StagingBase, forecast_mixin.TfundinstrForecastHistMixin, StagingParamMixin
):
    __tablename__ = "tfundinstr_forecast_hist"
