"""Regression coverage for SF-424 attachment element wrapping and ordering.

Encodes findings from a GG-vs-SGG SF-424 submission comparison (#10424): the
attachment fields ``AreasAffected`` and ``AdditionalCongressionalDistricts`` were
emitted as unwrapped ``att:*`` siblings on the form root, and all attachment blocks
(including the correctly wrapped ``AdditionalProjectTitle``) were relocated to the very
end of the document after ``DateSigned`` instead of their XSD sequence positions.

Each attachment must instead be wrapped in a form-namespace element and appear in its
correct position in the SF-424 element sequence.
"""

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms import init_form_registry
from src.services.xml_generation.config import _build_xml_form_map
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo
from tests.src.services.xml_generation.test_xml_validation_cases import VALID_APPLICATION

SF424_NS = "http://apply.grants.gov/forms/SF424_4_0-V4.0"
ATT_NS = "http://apply.grants.gov/system/Attachments-V1.0"

# Attachment field -> (element that must precede it, element that must follow it) in the
# SF-424 root sequence, per SF424_4_0-V4.0.xsd.
_ATTACHMENT_SEQUENCE = {
    "AreasAffected": ("CompetitionIdentificationTitle", "ProjectTitle"),
    "AdditionalProjectTitle": ("ProjectTitle", "CongressionalDistrictApplicant"),
    "AdditionalCongressionalDistricts": (
        "CongressionalDistrictProgramProject",
        "ProjectStartDate",
    ),
    "DebtExplanation": ("DelinquentFederalDebt", "CertificationAgree"),
}


@pytest.fixture(scope="module")
def all_attachments_root() -> lxml_etree._Element:
    """Generate the SF-424 XML for the case exercising every attachment field."""
    init_form_registry()
    application_data = {
        **VALID_APPLICATION,
        "additional_congressional_districts": "44444444-4444-4444-4444-444444444444",
        "areas_affected": "55555555-5555-5555-5555-555555555555",
        "delinquent_federal_debt": True,
        "debt_explanation": "66666666-6666-6666-6666-666666666666",
        "additional_project_title": [
            "77777777-7777-7777-7777-777777777777",
            "88888888-8888-8888-8888-888888888888",
            "99999999-9999-9999-9999-999999999999",
        ],
    }
    attachment_mapping = {
        attachment_id: AttachmentInfo(
            filename=filename,
            mime_type="application/pdf",
            file_location=f"./attachments/{filename}",
            hash_value="YQ==",
            hash_algorithm="SHA-1",
        )
        for attachment_id, filename in {
            "44444444-4444-4444-4444-444444444444": "additional_districts.pdf",
            "55555555-5555-5555-5555-555555555555": "geographic_areas.pdf",
            "66666666-6666-6666-6666-666666666666": "debt_explanation.pdf",
            "77777777-7777-7777-7777-777777777777": "project_overview.pdf",
            "88888888-8888-8888-8888-888888888888": "project_budget.pdf",
            "99999999-9999-9999-9999-999999999999": "project_partners.pdf",
        }.items()
    }
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data=application_data,
            transform_config=_build_xml_form_map()["SF424_4_0"],
            pretty_print=True,
            attachment_mapping=attachment_mapping,
        )
    )
    assert response.success, response.error_message
    assert response.xml_data is not None
    return lxml_etree.fromstring(response.xml_data.encode("utf-8"))


def _child_local_names(root: lxml_etree._Element) -> list[str]:
    return [lxml_etree.QName(child).localname for child in root]


@pytest.mark.parametrize("element_name", list(_ATTACHMENT_SEQUENCE))
def test_attachment_element_is_wrapped(
    all_attachments_root: lxml_etree._Element, element_name: str
) -> None:
    """Each attachment is a form-namespace wrapper with nested att: content, not siblings."""
    wrapper = all_attachments_root.find(f"{{{SF424_NS}}}{element_name}")
    assert wrapper is not None, f"{element_name} wrapper element missing"
    assert (
        wrapper.find(f".//{{{ATT_NS}}}FileName") is not None
    ), f"{element_name} attachment content is not nested inside the wrapper"
    # Regression guard: no att: content leaked as a bare sibling on the form root.
    assert all_attachments_root.find(f"{{{ATT_NS}}}FileName") is None


@pytest.mark.parametrize(
    ("element_name", "predecessor", "successor"),
    [(name, before, after) for name, (before, after) in _ATTACHMENT_SEQUENCE.items()],
)
def test_attachment_element_in_sequence_position(
    all_attachments_root: lxml_etree._Element,
    element_name: str,
    predecessor: str,
    successor: str,
) -> None:
    """Each attachment sits in its XSD sequence slot, not appended after DateSigned."""
    order = _child_local_names(all_attachments_root)
    assert order[-1] == "DateSigned", "DateSigned must remain the final element"
    assert order.index(element_name) < order.index(successor)
    if predecessor in order:
        assert order.index(predecessor) < order.index(element_name)
