from src.db.models.opportunity_models import Opportunity
from src.util import file_util
from src.util.env_config import PydanticBaseEnvConfig
from pydantic import Field

class OpportunityAttachmentConfig(PydanticBaseEnvConfig):

    # TODO - configure with s3 stuff in terraform OR just use the default?
    public_attachment_path: str = Field(alias="PUBLIC_FILES_OPPORTUNITY_ATTACHMENT_PATH")
    draft_attachment_path: str = Field(alias="DRAFT_FILES_OPPORTUNITY_ATTACHMENT_PATH")


    def build_path(self, opportunity: Opportunity) -> str:
        base_path = self.draft_attachment_path if opportunity.is_draft else self.public_attachment_path

        return file_util.join(base_path, "opportunities", str(opportunity.opportunity_id), "attachments")
