"""Regression coverage for SF-424 attachment element wrapping and ordering.

Encodes findings from a GG-vs-SGG SF-424 submission comparison (#10424): the
attachment fields ``AreasAffected`` and ``AdditionalCongressionalDistricts`` were
emitted as unwrapped ``att:*`` siblings on the form root, and all attachment blocks
(including the correctly wrapped ``AdditionalProjectTitle``) were relocated to the very
end of the document after ``DateSigned`` instead of their XSD sequence positions.

Each attachment must instead be wrapped in a form-namespace element and appear in its
correct position in the SF-424 element sequence.
"""

from pathlib import Path

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms import init_form_registry
from src.services.xml_generation.config import _build_xml_form_map
from src.services.xml_generation.validation.test_cases import get_all_test_cases
from src.services.xml_generation.validation.test_runner import ValidationTestRunner

SF424_NS = "http://apply.grants.gov/forms/SF424_4_0-V4.0"
ATT_NS = "http://apply.grants.gov/system/Attachments-V1.0"

XSD_DIR = Path(__file__).parents[4] / "src/services/xml_generation/xsds"

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
    runner = ValidationTestRunner(xsd_dir=XSD_DIR, xml_form_map=_build_xml_form_map())
    test_case = next(
        tc for tc in get_all_test_cases() if tc["name"] == "sf424_with_all_attachment_types"
    )
    result = runner.run_validation_test(
        test_name=test_case["name"],
        json_input=test_case["json_input"],
        xsd_url_or_path=test_case["xsd_url"],
        form_name=test_case.get("short_form_name", test_case.get("form_name", "SF424_4_0")),
        pretty_print=test_case.get("pretty_print", True),
        attachment_mapping=test_case.get("attachment_mapping"),
    )
    assert result["xml_content"], result["error_message"]
    return lxml_etree.fromstring(result["xml_content"].encode("utf-8"))


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
