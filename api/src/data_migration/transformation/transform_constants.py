from enum import StrEnum
from typing import TypeAlias, TypeVar

from src.db.models.base import ApiSchemaTable
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
from src.db.models.staging.staging_base import StagingParamMixin
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

ORPHANED_CFDA = "orphaned_cfda"
ORPHANED_HISTORICAL_RECORD = "orphaned_historical_record"
ORPHANED_DELETE_RECORD = "orphaned_delete_record"

OPPORTUNITY = "opportunity"
ASSISTANCE_LISTING = "assistance_listing"
OPPORTUNITY_SUMMARY = "opportunity_summary"
APPLICANT_TYPE = "applicant_type"
FUNDING_CATEGORY = "funding_category"
FUNDING_INSTRUMENT = "funding_instrument"


class Metrics(StrEnum):
    TOTAL_RECORDS_PROCESSED = "total_records_processed"
    TOTAL_RECORDS_DELETED = "total_records_deleted"
    TOTAL_RECORDS_INSERTED = "total_records_inserted"
    TOTAL_RECORDS_UPDATED = "total_records_updated"
    TOTAL_RECORDS_ORPHANED = "total_records_orphaned"
    TOTAL_DUPLICATE_RECORDS_SKIPPED = "total_duplicate_records_skipped"
    TOTAL_HISTORICAL_ORPHANS_SKIPPED = "total_historical_orphans_skipped"
    TOTAL_DELETE_ORPHANS_SKIPPED = "total_delete_orphans_skipped"

    TOTAL_ERROR_COUNT = "total_error_count"


S = TypeVar("S", bound=StagingParamMixin)
D = TypeVar("D", bound=ApiSchemaTable)


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

SourceAny: TypeAlias = (
    SourceSummary | SourceApplicantType | SourceFundingCategory | SourceFundingInstrument
)
