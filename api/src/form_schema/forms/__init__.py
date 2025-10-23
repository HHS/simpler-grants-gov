from src.db.models.competition_models import Form

from .sf424 import SF424_v4_0
from .sf424a import SF424a_v1_0
from .sf424b import SF424b_v1_1
from .sflll import SFLLL_v2_0
from .project_abstract_summary import ProjectAbstractSummary_v2_0
from .budget_narrative_attachment import BudgetNarrativeAttachment_v1_2
from .project_narrative_attachment import ProjectNarrativeAttachment_v1_2

def get_active_forms() -> list[Form]:
    """Get all active forms."""
    return [
        SF424_v4_0,
        SF424a_v1_0,
        SF424b_v1_1,
        SFLLL_v2_0,
        ProjectAbstractSummary_v2_0,
        BudgetNarrativeAttachment_v1_2,
        ProjectNarrativeAttachment_v1_2
    ]