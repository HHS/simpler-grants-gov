import logging

from src.db.models.competition_models import Form

from ..registry.form_template_registry import form_template_registry
from .attachment_form import AttachmentForm_v1_2
from .budget_narrative_attachment import BudgetNarrativeAttachment_v1_2
from .cd511 import CD511_v1_1
from .epa_form_4700_4 import EPA_FORM_4700_4_v5_0
from .epa_key_contacts import EPA_KEY_CONTACT_v2_0
from .gg_lobbying_form import GG_LobbyingForm_v1_1
from .key_contacts import KeyContacts_v2_0
from .key_contacts_generated import FORM as KeyContactsGenerated_v2_0
from .other_narrative_attachment import OtherNarrativeAttachment_v1_2
from .project_abstract import ProjectAbstract_v1_2
from .project_abstract_summary import ProjectAbstractSummary_v2_0
from .project_narrative_attachment import ProjectNarrativeAttachment_v1_2
from .project_performance_site_location import ProjectPerformanceSiteLocation_v4_0
from .sf424 import SF424_v4_0
from .sf424_short import SF424Short_v3_0
from .sf424a import SF424a_v1_0
from .sf424b import SF424b_v1_1
from .sf424c import SF424c_v2_0
from .sf424d import SF424d_v1_1
from .sflll import SFLLL_v2_0
from .supplementary_neh_cover_sheet import SupplementaryNEHCoverSheet_v3_0

logger = logging.getLogger(__name__)

_ALL_FORMS: list[Form] = [
    SF424_v4_0,
    SF424Short_v3_0,
    SF424a_v1_0,
    SF424b_v1_1,
    SF424c_v2_0,
    SF424d_v1_1,
    SFLLL_v2_0,
    ProjectAbstractSummary_v2_0,
    ProjectAbstract_v1_2,
    BudgetNarrativeAttachment_v1_2,
    ProjectNarrativeAttachment_v1_2,
    OtherNarrativeAttachment_v1_2,
    AttachmentForm_v1_2,
    CD511_v1_1,
    SupplementaryNEHCoverSheet_v3_0,
    GG_LobbyingForm_v1_1,
    EPA_FORM_4700_4_v5_0,
    EPA_KEY_CONTACT_v2_0,
    KeyContacts_v2_0,
    ProjectPerformanceSiteLocation_v4_0,
    KeyContactsGenerated_v2_0,
]

# Forms generated from forms/specs that mirror a hand-written form still in _ALL_FORMS.
# Each shares its hand-written form's name, so the two can't sit in one competition.
# A form leaves this list when it replaces the hand-written form it mirrors.
GENERATED_FORMS: list[Form] = [
    KeyContactsGenerated_v2_0,
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


def get_forms_for_all_forms_competition(forms: list[Form]) -> list[Form]:
    """The forms a competition offering every form should include.

    Leaves out GENERATED_FORMS: listed beside the hand-written form it mirrors, each would
    show up as a second row with the same name. Each generated form gets a competition of
    its own instead.
    """
    generated_ids = {form.form_id for form in GENERATED_FORMS}
    return [form for form in forms if form.form_id not in generated_ids]
