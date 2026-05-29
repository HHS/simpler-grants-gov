import logging

from src.db.models.competition_models import Form

from ..registry.form_template_registry import form_template_registry
from .attachment_form import AttachmentForm_v1_2
from .budget_narrative_attachment import BudgetNarrativeAttachment_v1_2
from .cd511 import CD511_v1_1
from .epa_form_4700_4 import EPA_FORM_4700_4_v5_0
from .epa_key_contacts import EPA_KEY_CONTACT_v2_0
from .gg_lobbying_form import GG_LobbyingForm_v1_1
from .other_narrative_attachment import OtherNarrativeAttachment_v1_2
from .project_abstract import ProjectAbstract_v1_2
from .project_abstract_summary import ProjectAbstractSummary_v2_0
from .project_narrative_attachment import ProjectNarrativeAttachment_v1_2
from .sandbox import SANDBOX
from .sandbox_budget_items import SANDBOX_BUDGET_ITEMS
from .sandbox_min_max import SANDBOX_FIELDLIST_MIN_MAX
from .project_performance_site_location import ProjectPerformanceSiteLocation_v4_0
from .sf424 import SF424_v4_0
from .sf424a import SF424a_v1_0
from .sf424b import SF424b_v1_1
from .sf424d import SF424d_v1_1
from .sflll import SFLLL_v2_0
from .supplementary_neh_cover_sheet import SupplementaryNEHCoverSheet_v3_0

logger = logging.getLogger(__name__)

_ALL_FORMS: list[Form] = [
    SF424_v4_0,
    SF424a_v1_0,
    SF424b_v1_1,
    SF424d_v1_1,
    SFLLL_v2_0,
    ProjectAbstractSummary_v2_0,
    ProjectAbstract_v1_2,
    BudgetNarrativeAttachment_v1_2,
    ProjectNarrativeAttachment_v1_2,
    OtherNarrativeAttachment_v1_2,
    AttachmentForm_v1_2,
    CD511_v1_1,
    SANDBOX,
    SANDBOX_BUDGET_ITEMS,
    SANDBOX_FIELDLIST_MIN_MAX,
    SupplementaryNEHCoverSheet_v3_0,
    GG_LobbyingForm_v1_1,
    EPA_FORM_4700_4_v5_0,
    EPA_KEY_CONTACT_v2_0,
    ProjectPerformanceSiteLocation_v4_0,
]


def init_form_registry() -> None:
    logger.info("Registering forms")
    if len(form_template_registry.get_all()) == 0:
        for _form in _ALL_FORMS:
            form_template_registry.register(_form, major_version=1)

    logger.info("Finished registering forms")


def get_active_forms() -> list[Form]:
    """Get all active forms."""
    return form_template_registry.get_all()
