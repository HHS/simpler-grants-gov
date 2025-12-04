from src.db.models.competition_models import Form

from .budget_narrative_attachment import BudgetNarrativeAttachment_v1_2
from .cd511 import CD511_v1_1
from .epa_form_4700_4 import EPA_FORM_4700_4_v5_0
from .epa_key_contacts import EPA_KEY_CONTACT_v2_0
from .gg_lobbying_form import GG_LobbyingForm_v1_1
from .other_narrative_attachment import OtherNarrativeAttachment_v1_2
from .project_abstract import ProjectAbstract_v1_2
from .project_abstract_summary import ProjectAbstractSummary_v2_0
from .project_narrative_attachment import ProjectNarrativeAttachment_v1_2
from .sf424 import SF424_v4_0
from .sf424a import SF424a_v1_0
from .sf424b import SF424b_v1_1
from .sf424d import SF424d_v1_1
from .sflll import SFLLL_v2_0
from .supplementary_neh_cover_sheet import SupplementaryNEHCoverSheet_v3_0


def get_active_forms() -> list[Form]:
    """Get all active forms."""
    return [
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
        CD511_v1_1,
        SupplementaryNEHCoverSheet_v3_0,
        GG_LobbyingForm_v1_1,
        EPA_FORM_4700_4_v5_0,
        EPA_KEY_CONTACT_v2_0,
    ]
