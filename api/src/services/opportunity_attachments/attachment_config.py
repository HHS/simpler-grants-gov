from src.db.models.opportunity_models import Opportunity
from src.util import file_util
from src.util.env_config import PydanticBaseEnvConfig
from pydantic import Field

class OpportunityAttachmentConfig(PydanticBaseEnvConfig):
    public_attachment_path: str = Field(alias="PUBLIC_FILES_BUCKET")
    draft_attachment_path: str = Field(alias="DRAFT_FILES_BUCKET")
