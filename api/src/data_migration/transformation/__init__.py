from typing import TypeAlias

from src.db.models.staging.forecast import Tforecast, TforecastHist
from src.db.models.staging.synopsis import Tsynopsis, TsynopsisHist

SourceSummary: TypeAlias = Tforecast | Tsynopsis | TforecastHist | TsynopsisHist
