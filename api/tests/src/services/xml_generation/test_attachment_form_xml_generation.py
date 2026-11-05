"""
Tests for Attachment Form XML generation.

The Attachment Form has 15 optional attachment fields (att1 to att15). Each one is
written as <ATTn><ATTnFile>...</ATTnFile></ATTn>, and the XSD expects them in
ATT1 to ATT15 order whatever order the answers were saved in.

Covers:
- Per-file FileName, MimeType, FileLocation and HashValue output, in XSD order
- All 15 attachment fields, and output order when they are saved out of order
- An empty form and a null attachment field
- Failure when an attachment UUID is missing from the attachment mapping
- XSD validation, both standalone and inside a complete submission

XSD Reference:
https://apply07.grants.gov/apply/forms/schemas/AttachmentForm_1_2-V1.2.xsd
"""

from pathlib import Path

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms.attachment_form import (
    FORM_XML_TRANSFORM_RULES as ATTACHMENT_FORM_TRANSFORM_RULES,
)
from src.form_schema.forms.attachment_form import AttachmentForm_v1_2
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.models.attachment import AttachmentFile
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.submission_xml_assembler import SubmissionXMLAssembler
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo
from src.services.xml_generation.validation.xsd_validator import XSDValidator
from tests.src.db.models.factories import (
    ApplicationFactory,
    ApplicationFormFactory,
    ApplicationSubmissionFactory,
    CompetitionFactory,
    CompetitionFormFactory,
)

_SNAPSHOT_PATH = Path(__file__).parent / "snapshots" / "attachment_form_1_2.xml"

FORM_NS = "http://apply.grants.gov/forms/AttachmentForm_1_2-V1.2"
ATT_NS = "http://apply.grants.gov/system/Attachments-V1.0"
GLOB_NS = "http://apply.grants.gov/system/Global-V1.0"

XSD_DIR = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
XSD_FILE_NAME = "AttachmentForm_1_2-V1.2.xsd"

FIELD_COUNT = 15

# Fixed UUIDs and file details so the snapshot output is deterministic
ATTACHMENT_MAPPING = {
    f"{i:08d}-aaaa-4bbb-8ccc-dddddddddddd": AttachmentInfo(
        filename=f"attachment_{i}.pdf",
        mime_type="application/pdf",
        file_location=f"attachment_{i}.pdf",
        hash_value=AttachmentFile.compute_base64_sha1_from_content(f"attachment {i}".encode()),
    )
    for i in range(1, FIELD_COUNT + 1)
}
UUIDS = list(ATTACHMENT_MAPPING)

# Every field filled in, att1 -> first UUID, ... att15 -> last UUID
ALL_FIELDS_DATA = {f"att{i}": UUIDS[i - 1] for i in range(1, FIELD_COUNT + 1)}

# A few fields, saved in an order that doesn't match the XSD sequence
OUT_OF_ORDER_DATA = {
    "att15": UUIDS[14],
    "att3": UUIDS[2],
    "att9": UUIDS[8],
    "att1": UUIDS[0],
}


def _generate_response(data: dict):
    return XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data=data,
            transform_config=ATTACHMENT_FORM_TRANSFORM_RULES,
            attachment_mapping=ATTACHMENT_MAPPING,
        )
    )


def _generate(data: dict) -> str:
    response = _generate_response(data)
    assert response.success, response.error_message
    return response.xml_data


def _parse(xml_data: str):
    parser = lxml_etree.XMLParser(remove_blank_text=True)
    return lxml_etree.fromstring(xml_data.encode("utf-8"), parser=parser)


def _local_names(element) -> list[str]:
    return [lxml_etree.QName(child).localname for child in element]


def _xsd_sequence() -> list[str]:
    """ATT element names, in order, from the AttachmentForm_1_2 sequence in the XSD."""
    xs = {"xs": "http://www.w3.org/2001/XMLSchema"}
    xsd = lxml_etree.parse(str(XSD_DIR / XSD_FILE_NAME))
    return [
        element.get("name")
        for element in xsd.findall(
            "xs:element[@name='AttachmentForm_1_2']/xs:complexType/xs:sequence/xs:element", xs
        )
    ]


def _file_names(root) -> list[str]:
    return [
        file_name.text
        for file_name in root.iterfind(f"{{{FORM_NS}}}*/{{{FORM_NS}}}*/{{{ATT_NS}}}FileName")
    ]


class TestAttachmentFormXMLGeneration:
    """XML generation tests for the Attachment Form."""

    def test_generate_single_attachment_writes_file_metadata(self):
        """One attachment is written as ATTn > ATTnFile with the file details in XSD order."""
        attachment = ATTACHMENT_MAPPING[UUIDS[0]]

        root = _parse(_generate({"att1": UUIDS[0]}))

        assert _local_names(root) == ["ATT1"]
        att1_file = root.find(f"{{{FORM_NS}}}ATT1/{{{FORM_NS}}}ATT1File")
        assert att1_file is not None

        # Attachments-V1.0 AttachedFileDataType: FileName -> MimeType -> FileLocation -> HashValue
        assert [child.tag for child in att1_file] == [
            f"{{{ATT_NS}}}FileName",
            f"{{{ATT_NS}}}MimeType",
            f"{{{ATT_NS}}}FileLocation",
            f"{{{GLOB_NS}}}HashValue",
        ]
        assert att1_file.findtext(f"{{{ATT_NS}}}FileName") == attachment.filename
        assert att1_file.findtext(f"{{{ATT_NS}}}MimeType") == attachment.mime_type
        file_location = att1_file.find(f"{{{ATT_NS}}}FileLocation")
        assert file_location.get(f"{{{ATT_NS}}}href") == attachment.file_location
        hash_value = att1_file.find(f"{{{GLOB_NS}}}HashValue")
        assert hash_value.text == attachment.hash_value
        assert hash_value.get(f"{{{GLOB_NS}}}hashAlgorithm") == "SHA-1"

    def test_generate_xml_root_and_attachment_structure(self):
        """Root element, namespaces and FormVersion, with a field from the middle of the form."""
        root = _parse(_generate({"att3": UUIDS[2]}))

        assert root.tag == f"{{{FORM_NS}}}AttachmentForm_1_2"
        # attributeFormDefault is qualified, so FormVersion has to be in the form namespace
        assert root.attrib == {f"{{{FORM_NS}}}FormVersion": "1.2"}
        assert root.nsmap["att"] == ATT_NS
        assert root.nsmap["glob"] == GLOB_NS

        assert _local_names(root) == ["ATT3"]
        assert _local_names(root.find(f"{{{FORM_NS}}}ATT3")) == ["ATT3File"]
        assert _file_names(root) == [ATTACHMENT_MAPPING[UUIDS[2]].filename]

    def test_generate_all_fifteen_attachments(self):
        """Every attachment field is written, each with its own file, in XSD order."""
        root = _parse(_generate(ALL_FIELDS_DATA))

        assert _local_names(root) == _xsd_sequence()
        for i in range(1, FIELD_COUNT + 1):
            att = root.find(f"{{{FORM_NS}}}ATT{i}")
            assert _local_names(att) == [f"ATT{i}File"]
            assert (
                att.findtext(f"{{{FORM_NS}}}ATT{i}File/{{{ATT_NS}}}FileName")
                == ATTACHMENT_MAPPING[UUIDS[i - 1]].filename
            )

    def test_generate_out_of_order_population_follows_xsd_sequence(self):
        """Fields saved as att15, att3, att9, att1 still come out as ATT1, ATT3, ATT9, ATT15."""
        root = _parse(_generate(OUT_OF_ORDER_DATA))

        assert _local_names(root) == ["ATT1", "ATT3", "ATT9", "ATT15"]
        # Each element still carries its own field's file
        assert _file_names(root) == [
            ATTACHMENT_MAPPING[UUIDS[i - 1]].filename for i in (1, 3, 9, 15)
        ]

    def test_generate_empty_form_writes_only_the_root(self):
        """With no attachments, the form is just the root element with its FormVersion."""
        root = _parse(_generate({}))

        assert root.tag == f"{{{FORM_NS}}}AttachmentForm_1_2"
        assert root.attrib == {f"{{{FORM_NS}}}FormVersion": "1.2"}
        assert len(root) == 0

    def test_generate_null_attachment_field_is_excluded(self):
        """A field saved as null is left out rather than written empty."""
        root = _parse(_generate({"att1": None, "att2": UUIDS[1]}))

        assert _local_names(root) == ["ATT2"]

    @pytest.mark.parametrize("field", ["att1", "att15"])
    def test_generate_missing_uuid_in_mapping_fails(self, field):
        """An attachment UUID that isn't in the attachment mapping fails generation."""
        missing_uuid = "99999999-aaaa-4bbb-8ccc-dddddddddddd"
        data = {"att2": UUIDS[1], field: missing_uuid}

        response = _generate_response(data)

        assert response.success is False
        assert response.xml_data is None
        assert f"Attachment UUID {missing_uuid} for field '{field}'" in response.error_message
        assert "not found in attachment mapping" in response.error_message

    def test_generate_attachment_form_snapshot(self):
        """Regression snapshot test pinning the full generated XML output.

        To regenerate after an intentional change, delete
        snapshots/attachment_form_1_2.xml and re-run the test, which recreates it.
        """
        xml_data = _generate(ALL_FIELDS_DATA)

        if not _SNAPSHOT_PATH.exists():
            _SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
            _SNAPSHOT_PATH.write_text(xml_data)
            pytest.skip("Snapshot created — re-run to validate")

        assert xml_data == _SNAPSHOT_PATH.read_text()


class TestAttachmentFormXSDValidation:
    """XSD validation tests for the Attachment Form XML."""

    @pytest.fixture
    def xsd_validator(self):
        if not (XSD_DIR / XSD_FILE_NAME).exists():
            pytest.skip(f"{XSD_FILE_NAME} not found. Run 'flask task fetch-xsds'.")
        return XSDValidator(XSD_DIR)

    def _validate(self, xsd_validator, xml_data: str) -> dict:
        return xsd_validator.validate_xml(xml_data, XSD_DIR / XSD_FILE_NAME)

    @pytest.mark.parametrize(
        "data",
        [{}, {"att1": UUIDS[0]}, ALL_FIELDS_DATA, OUT_OF_ORDER_DATA],
        ids=["empty", "single", "all_fields", "out_of_order"],
    )
    def test_attachment_form_xml_validates_against_xsd(self, xsd_validator, data):
        xml_data = _generate(data)

        validation_result = self._validate(xsd_validator, xml_data)

        assert validation_result["valid"], (
            f"XSD validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{xml_data}"
        )

    def test_attachment_elements_out_of_xsd_order_fail_validation(self, xsd_validator):
        """The XSD rejects ATT elements out of sequence, so the validation above would catch
        a regression in ordering, not just in content."""
        root = _parse(_generate({"att1": UUIDS[0], "att2": UUIDS[1]}))
        root.append(root[0])  # move ATT1 after ATT2

        assert _local_names(root) == ["ATT2", "ATT1"]
        validation_result = self._validate(
            xsd_validator, lxml_etree.tostring(root, encoding="unicode")
        )

        assert validation_result["valid"] is False
        assert "ATT1" in validation_result["error_message"]

    def test_attachment_form_submission_xml_validates_against_xsd(
        self, enable_factory_create, seed_form_registry, xsd_validator
    ):
        """The form inside a complete submission, as the submission task produces it."""
        competition = CompetitionFactory.create(competition_forms=[])
        competition_form = CompetitionFormFactory.create(
            competition=competition, form=AttachmentForm_v1_2
        )
        application = ApplicationFactory.create(competition=competition)
        ApplicationFormFactory.create(
            application=application,
            competition_form=competition_form,
            application_response=OUT_OF_ORDER_DATA,
        )
        application_submission = ApplicationSubmissionFactory.create(application=application)

        assembler = SubmissionXMLAssembler(application, application_submission, ATTACHMENT_MAPPING)
        xml_string = assembler.generate_complete_submission_xml(pretty_print=True)

        form_elements = _parse(xml_string).findall(
            ".//{http://apply.grants.gov/system/MetaGrantApplication}Forms"
            f"/{{{FORM_NS}}}AttachmentForm_1_2"
        )
        assert len(form_elements) == 1
        assert _local_names(form_elements[0]) == ["ATT1", "ATT3", "ATT9", "ATT15"]

        form_xml = lxml_etree.tostring(form_elements[0], encoding="unicode")
        validation_result = self._validate(xsd_validator, form_xml)

        assert validation_result["valid"], (
            f"XSD validation failed:\n"
            f"Error: {validation_result['error_message']}\n"
            f"Generated XML:\n{form_xml}"
        )
