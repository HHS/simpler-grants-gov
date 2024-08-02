import logging
from datetime import datetime

from pydantic_settings import SettingsConfigDict

import src.data_migration.transformation.transform_constants as transform_constants
from src.adapters import db
from src.data_migration.transformation.subtask.transform_applicant_type import (
    TransformApplicantType,
)
from src.data_migration.transformation.subtask.transform_assistance_listing import (
    TransformAssistanceListing,
)
from src.data_migration.transformation.subtask.transform_funding_category import (
    TransformFundingCategory,
)
from src.data_migration.transformation.subtask.transform_funding_instrument import (
    TransformFundingInstrument,
)
from src.data_migration.transformation.subtask.transform_opportunity import TransformOpportunity
from src.data_migration.transformation.subtask.transform_opportunity_summary import (
    TransformOpportunitySummary,
)
from src.task.task import Task
from src.util import datetime_util
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class TransformOracleDataTaskConfig(PydanticBaseEnvConfig):
    model_config = SettingsConfigDict(env_prefix="TRANSFORM_ORACLE_DATA_")

    enable_opportunity: bool = True  # TRANSFORM_ORACLE_DATA_ENABLE_OPPORTUNITY
    enable_assistance_listing: bool = True  # TRANSFORM_ORACLE_DATA_ENABLE_ASSISTANCE_LISTING
    enable_opportunity_summary: bool = True  # TRANSFORM_ORACLE_DATA_ENABLE_OPPORTUNITY_SUMMARY
    enable_applicant_type: bool = True  # TRANSFORM_ORACLE_DATA_ENABLE_APPLICANT_TYPE
    enable_funding_category: bool = True  # TRANSFORM_ORACLE_DATA_ENABLE_FUNDING_CATEGORY
    enable_funding_instrument: bool = True  # TRANSFORM_ORACLE_DATA_ENABLE_FUNDING_INSTRUMENT


class TransformOracleDataTask(Task):
    Metrics = transform_constants.Metrics

    def __init__(
        self,
        db_session: db.Session,
        transform_time: datetime | None = None,
        transform_config: TransformOracleDataTaskConfig | None = None,
    ) -> None:
        super().__init__(db_session)

        if transform_time is None:
            transform_time = datetime_util.utcnow()
        self.transform_time = transform_time

        if transform_config is None:
            transform_config = TransformOracleDataTaskConfig()
        self.transform_config = transform_config

    def run_task(self) -> None:
        if self.transform_config.enable_opportunity:
            TransformOpportunity(self).run()

        if self.transform_config.enable_assistance_listing:
            TransformAssistanceListing(self).run()

        if self.transform_config.enable_opportunity_summary:
            TransformOpportunitySummary(self).run()

        if self.transform_config.enable_applicant_type:
            TransformApplicantType(self).run()

        if self.transform_config.enable_funding_category:
            TransformFundingCategory(self).run()

        if self.transform_config.enable_funding_instrument:
            TransformFundingInstrument(self).run()
