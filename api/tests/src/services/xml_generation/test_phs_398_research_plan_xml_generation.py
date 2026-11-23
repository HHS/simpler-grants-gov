"""Authored PHS wrappers through the real XML consumer and official source XSD."""

import uuid
from pathlib import Path

import pytest
from lxml import etree

from src.form_schema.forms.phs_398_research_plan_generated import FORM_XML_TRANSFORM_RULES
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.models.attachment import AttachmentFile
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo
from src.services.xml_generation.validation.xsd_validator import XSDValidator

_NS = "http://apply.grants.gov/forms/PHS398_ResearchPlan_5_0-V5.0"
_ATT = "http://apply.grants.gov/system/Attachments-V1.0"
_XSDS = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
_SNAPSHOT = Path(__file__).parent / "snapshots/phs_398_research_plan_5_0.xml"
_FIELDS = (
    ("introduction_to_application", "IntroductionToApplication"),
    ("specific_aims", "SpecificAims"),
    ("research_strategy", "ResearchStrategy"),
    ("progress_report_publication_list", "ProgressReportPublicationList"),
    ("vertebrate_animals", "VertebrateAnimals"),
    ("select_agent_research", "SelectAgentResearch"),
    ("multiple_pd_pi_leadership_plan", "MultiplePDPILeadershipPlan"),
    ("consortium_contractual_arrangements", "ConsortiumContractualArrangements"),
    ("letters_of_support", "LettersOfSupport"),
    ("resource_sharing_plans", "ResourceSharingPlans"),
    ("other_plans", "OtherPlans"),
    (
        "authentication_of_key_biological_and_or_chemical_resources",
        "KeyBiologicalAndOrChemicalResources",
    ),
)


def data_and_uploads(all_documents=False, appendix_count=None):
    fields = _FIELDS if all_documents else (("research_strategy", "ResearchStrategy"),)
    data = {field: str(uuid.uuid5(uuid.NAMESPACE_DNS, field)) for field, _ in fields}
    if appendix_count is not None:
        data["appendix"] = [
            str(uuid.uuid5(uuid.NAMESPACE_DNS, f"appendix-{i}")) for i in range(appendix_count)
        ]
    ids = [*data.values()]
    uploads = {
        i: AttachmentInfo(
            filename=f"{i}.pdf",
            mime_type="application/pdf",
            file_location=f"{i}.pdf",
            hash_value=AttachmentFile.compute_base64_sha1_from_content(i.encode()),
        )
        for v in ids
        for i in (v if isinstance(v, list) else [v])
    }
    return data, uploads


def generate(data, uploads):
    return XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data=data,
            transform_config=FORM_XML_TRANSFORM_RULES,
            attachment_mapping=uploads,
        )
    )


@pytest.mark.parametrize(
    "all_documents,appendix_count", [(False, None), (False, 0), (True, 2), (True, 10)]
)
def test_output_and_xsd(all_documents, appendix_count):
    data, uploads = data_and_uploads(all_documents, appendix_count)
    result = generate(data, uploads)
    assert result.success, result.error_message
    root = etree.fromstring(result.xml_data.encode())
    assert root.get(f"{{{_NS}}}FormVersion") == "5.0"
    group = root.find(f"{{{_NS}}}ResearchPlanAttachments")
    assert group is not None
    expected = [xml for field, xml in _FIELDS if field in data]
    if appendix_count:
        expected.append("Appendix")
    assert [etree.QName(n).localname for n in group] == expected
    for field, xml in _FIELDS:
        wrapper = group.find(f"{{{_NS}}}{xml}")
        if field not in data:
            assert wrapper is None
            continue
        attfile = wrapper.find(f"{{{_NS}}}attFile")
        assert attfile is not None
        assert attfile.findtext(f"{{{_ATT}}}FileName") == uploads[data[field]].filename
    appendix = group.find(f"{{{_NS}}}Appendix")
    files = [] if appendix is None else appendix.findall(f"{{{_ATT}}}AttachedFile")
    assert [f.findtext(f"{{{_ATT}}}FileName") for f in files] == [
        uploads[i].filename for i in data.get("appendix", [])
    ]
    validation = XSDValidator(_XSDS).validate_xml(
        result.xml_data, _XSDS / "PHS398_ResearchPlan_5_0-V5.0.xsd"
    )
    assert validation["valid"], validation


@pytest.mark.parametrize("missing", ["research_strategy", "appendix"])
def test_unknown_upload_fails(missing):
    data, uploads = data_and_uploads(True, 2)
    upload = data[missing][0] if isinstance(data[missing], list) else data[missing]
    del uploads[upload]
    result = generate(data, uploads)
    assert not result.success
    assert upload in result.error_message


def test_snapshot():
    data, uploads = data_and_uploads(True, 2)
    result = generate(data, uploads)
    assert result.success, result.error_message
    assert result.xml_data == _SNAPSHOT.read_text()
