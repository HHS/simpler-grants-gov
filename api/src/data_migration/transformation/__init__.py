from typing import TypeAlias

from src.db.models.staging.forecast import (
    TapplicanttypesForecast,
    TapplicanttypesForecastHist,
    Tforecast,
    TforecastHist,
    TfundactcatForecast,
    TfundactcatForecastHist,
    TfundinstrForecast,
    TfundinstrForecastHist,
)
from src.db.models.staging.synopsis import (
    TapplicanttypesSynopsis,
    TapplicanttypesSynopsisHist,
    TfundactcatSynopsis,
    TfundactcatSynopsisHist,
    TfundinstrSynopsis,
    TfundinstrSynopsisHist,
    Tsynopsis,
    TsynopsisHist,
)

SourceSummary: TypeAlias = Tforecast | Tsynopsis | TforecastHist | TsynopsisHist

SourceApplicantType: TypeAlias = (
    TapplicanttypesForecast
    | TapplicanttypesForecastHist
    | TapplicanttypesSynopsis
    | TapplicanttypesSynopsisHist
)

SourceFundingCategory: TypeAlias = (
    TfundactcatForecast | TfundactcatForecastHist | TfundactcatSynopsis | TfundactcatSynopsisHist
)

SourceFundingInstrument: TypeAlias = (
    TfundinstrForecastHist | TfundinstrForecast | TfundinstrSynopsisHist | TfundinstrSynopsis
)
