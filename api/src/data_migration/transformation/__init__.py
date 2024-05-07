from typing import TypeAlias
from src.db.models.staging.forecast import Tforecast, TforecastHist, TapplicanttypesForecast, TapplicanttypesForecastHist, TfundinstrForecastHist, TfundinstrForecast, TfundactcatForecastHist, TfundactcatForecast
from src.db.models.staging.synopsis import Tsynopsis, TsynopsisHist, TapplicanttypesSynopsis, TapplicanttypesSynopsisHist, TfundinstrSynopsisHist, TfundinstrSynopsis, TfundactcatSynopsisHist, TfundactcatSynopsis

SourceSummary: TypeAlias = Tforecast | Tsynopsis | TforecastHist | TsynopsisHist

SourceApplicantType: TypeAlias = TapplicanttypesForecast | TapplicanttypesForecastHist | TapplicanttypesSynopsis | TapplicanttypesSynopsisHist

SourceFundingCategory: TypeAlias = TfundactcatForecast | TfundactcatForecastHist | TfundactcatSynopsis | TfundactcatSynopsisHist

SourceFundingInstrument: TypeAlias = TfundinstrForecastHist | TfundinstrForecast | TfundinstrSynopsisHist | TfundinstrSynopsis
