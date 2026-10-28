"""Tests for XML generation from a mapping shaped like the XML (``xml_mapping.json``)."""

import json
from pathlib import Path
from typing import Any

import pytest

from src.services.xml_generation.mapping import (
    generate_xml_from_mapping,
    is_xml_mapping,
    mapped_root_fields,
)
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.utils.attachment_mapping import AttachmentInfo
from src.services.xml_generation.value_transformers import ValueTransformationError

_HERE = Path(__file__).parent
_SNAPSHOTS = _HERE / "snapshots"


def _mapping(name: str) -> dict[str, Any]:
    """A form's mapping as the form library emits it (forms/emitters/xml)."""
    return json.loads((_HERE / "fixtures" / "xml_mapping" / f"{name}.json").read_text())


def _small_mapping(content: dict[str, Any]) -> dict[str, Any]:
    return {
        "format": "xml-mapping",
        "namespaces": {
            "default": "urn:form",
            "Form": "urn:form",
            "lib": "urn:lib",
            "att": "http://apply.grants.gov/system/Attachments-V1.0",
        },
        "root": {"Root": content},
    }


def _generate(mapping: dict[str, Any], data: dict[str, Any], **kwargs: Any) -> str:
    return generate_xml_from_mapping(mapping, data, **kwargs)


_ADDITIONAL_LOCATIONS = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
_ADDITIONAL_LOCATIONS_FILE = AttachmentInfo(
    filename="additional_locations.pdf",
    mime_type="application/pdf",
    file_location="additional_locations.pdf",
    hash_value="aeB1+6gdFwih51ijIRn3b8QYn24=",
)


class TestMatchesTheCurrentGenerator:
    """The emitted mappings write the same XML the hand-written forms' rules do, from the
    data each snapshot test uses."""

    def test_key_contacts(self) -> None:
        data = {
            "applicant_organization_name": "Acme Corporation",
            "key_contacts": [
                {
                    "project_role": "Principal Investigator",
                    "name": {"prefix": "Dr.", "first_name": "Jane", "last_name": "Smith"},
                    "title": "Senior Researcher",
                    "address": {
                        "street1": "123 Main Street",
                        "city": "Washington",
                        "state": "DC: District of Columbia",
                        "zip_code": "20001",
                        "country": "USA: UNITED STATES",
                    },
                    "phone": "2025550100",
                    "email": "jane.smith@acme.org",
                }
            ],
        }

        xml = _generate(_mapping("key_contacts"), data)

        assert xml == (_SNAPSHOTS / "key_contacts_2_0.xml").read_text()

    def test_performance_sites(self) -> None:
        us_site = {
            "submitting_as_individual": False,
            "organization_name": "Example University",
            "uei": "ABCDEFGHIJ12",
            "address": {
                "street1": "123 Research Blvd",
                "street2": "Suite 400",
                "city": "Science City",
                "county": "Grant County",
                "state": "CA: California",
                "country": "USA: UNITED STATES",
                "zip_code": "90210-1234",
            },
            "congressional_district": "CA-033",
        }
        international_site = {
            "submitting_as_individual": False,
            "organization_name": "International Research Institute",
            "address": {"street1": "10 Rue de la Paix", "city": "Paris", "country": "FRA: FRANCE"},
        }
        individual_site = {
            "submitting_as_individual": True,
            "address": {
                "street1": "456 Main St",
                "city": "Springfield",
                "country": "USA: UNITED STATES",
                "zip_code": "12345-6789",
                "state": "IL: Illinois",
            },
            "congressional_district": "IL-013",
        }
        data = {
            "primary_site": us_site,
            "additional_sites": [international_site, individual_site],
            "additional_locations_attachment": _ADDITIONAL_LOCATIONS,
        }

        xml = _generate(
            _mapping("performance_sites"),
            data,
            attachment_mapping={_ADDITIONAL_LOCATIONS: _ADDITIONAL_LOCATIONS_FILE},
        )

        assert xml == (_SNAPSHOTS / "performance_site_4_0.xml").read_text()


class TestValues:
    def test_writes_each_element_in_its_namespace(self) -> None:
        xml = _generate(
            _small_mapping({"Title": {"$field": "title"}, "lib:Note": {"$field": "note"}}),
            {"title": "A", "note": "B"},
        )

        assert "<Form:Title>A</Form:Title>" in xml
        assert "<lib:Note>B</lib:Note>" in xml

    def test_writes_an_attribute_with_its_prefix(self) -> None:
        xml = _generate(_small_mapping({"@Form:FormVersion": {"$const": "1.0"}}), {})

        assert 'Form:FormVersion="1.0"' in xml

    def test_rejects_an_attribute_without_a_prefix(self) -> None:
        with pytest.raises(ValueError, match="has no namespace prefix"):
            _generate(_small_mapping({"@FormVersion": {"$const": "1.0"}}), {})

    def test_leaves_out_elements_with_nothing_to_write(self) -> None:
        xml = _generate(
            _small_mapping(
                {
                    "Wrapper": {"Inner": {"$field": "missing"}},
                    "Empty": {"$field": "empty"},
                    "Present": {"$field": "here"},
                }
            ),
            {"here": "yes", "empty": ""},
        )

        assert "Wrapper" not in xml
        assert "Empty" not in xml
        assert "<Form:Present>yes</Form:Present>" in xml

    def test_reads_a_lists_entry_by_index_for_numbered_elements(self) -> None:
        mapping = _small_mapping(
            {
                "Type1": {"$field": "types.0"},
                "Type2": {"$field": "types.1"},
                "Type3": {"$field": "types.2"},
                "Count": {"$field": "types.length"},
            }
        )

        xml = _generate(mapping, {"types": ["A", "B"]})

        assert xml == (
            "<?xml version='1.0' encoding='utf-8'?>\n"
            '<Form:Root xmlns:Form="urn:form" xmlns:lib="urn:lib"'
            ' xmlns:att="http://apply.grants.gov/system/Attachments-V1.0">\n'
            "  <Form:Type1>A</Form:Type1>\n"
            "  <Form:Type2>B</Form:Type2>\n"
            "</Form:Root>"
        )

    def test_writes_a_boolean_as_true_or_false(self) -> None:
        mapping = _small_mapping({"Agrees": {"$field": "agrees"}, "@Form:Flag": {"$field": "flag"}})

        xml = _generate(mapping, {"agrees": True, "flag": False})

        assert "<Form:Agrees>true</Form:Agrees>" in xml
        assert 'Form:Flag="false"' in xml

    def test_writes_a_whole_number_without_a_decimal(self) -> None:
        mapping = _small_mapping({"Count": {"$field": "n"}, "Share": {"$field": "share"}})

        xml = _generate(mapping, {"n": 3.0, "share": 2.5})

        assert "<Form:Count>3</Form:Count>" in xml
        assert "<Form:Share>2.5</Form:Share>" in xml

    def test_transforms_a_value_by_name(self) -> None:
        mapping = _small_mapping(
            {"Agrees": {"$transform": {"name": "boolean_to_yes_no", "value": {"$field": "agrees"}}}}
        )

        assert "<Form:Agrees>Y: Yes</Form:Agrees>" in _generate(mapping, {"agrees": True})
        assert "Agrees" not in _generate(mapping, {})

    def test_matches_a_value_to_its_case(self) -> None:
        mapping = _small_mapping(
            {
                "Individual": {
                    "$match": {
                        "value": {"$field": "individual"},
                        "case": {"true": "Y: Yes", "false": "N: No"},
                    }
                }
            }
        )

        assert "<Form:Individual>Y: Yes</Form:Individual>" in _generate(
            mapping, {"individual": True}
        )
        assert "<Form:Individual>N: No</Form:Individual>" in _generate(
            mapping, {"individual": False}
        )
        assert "Individual" not in _generate(mapping, {})

    def test_keys_a_whole_number_as_an_integer(self) -> None:
        mapping = _small_mapping(
            {"Count": {"$match": {"value": {"$field": "n"}, "case": {"1": "One"}}}}
        )

        assert "<Form:Count>One</Form:Count>" in _generate(mapping, {"n": 1.0})

    def test_keys_a_list_as_compact_json(self) -> None:
        mapping = _small_mapping(
            {"Code": {"$match": {"value": {"$field": "codes"}, "case": {'["A","C"]': "AC"}}}}
        )

        assert "<Form:Code>AC</Form:Code>" in _generate(mapping, {"codes": ["A", "C"]})

    def test_combines_selections_into_one_code_whatever_their_order(self) -> None:
        mapping = _small_mapping(
            {
                "RevisionCode": {
                    "$transform": {
                        "name": "join_values",
                        "value": {"$field": "revision_codes"},
                        "params": {"sort": True},
                    }
                }
            }
        )

        for codes in (["A", "C"], ["C", "A"]):
            xml = _generate(mapping, {"revision_codes": codes})
            assert "<Form:RevisionCode>AC</Form:RevisionCode>" in xml

    def test_matches_an_unlisted_value_to_the_default(self) -> None:
        mapping = _small_mapping(
            {"Kind": {"$match": {"value": {"$field": "k"}, "case": {"a": "A"}, "default": "Other"}}}
        )

        assert "<Form:Kind>Other</Form:Kind>" in _generate(mapping, {"k": "b"})

    def test_rejects_an_unlisted_value_without_a_default(self) -> None:
        mapping = _small_mapping(
            {"Kind": {"$match": {"value": {"$field": "k"}, "case": {"a": "A"}}}}
        )

        with pytest.raises(ValueError, match="no case for 'b'"):
            _generate(mapping, {"k": "b"})

    def test_rejects_an_unknown_transform(self) -> None:
        mapping = _small_mapping({"A": {"$transform": {"name": "shout", "value": {"$field": "a"}}}})

        with pytest.raises(ValueTransformationError, match="Unknown transformation type: shout"):
            _generate(mapping, {"a": "x"})


class TestRequired:
    _MAPPING = _small_mapping(
        {
            "DateReceived": {"$required": {"$field": "date_received"}},
            "Wrapper": {"$required": {"Inner": {"$field": "inner"}}},
            "@Form:Flag": {"$required": {"$field": "flag"}},
        }
    )

    def test_writes_an_empty_element_when_it_has_nothing_to_write(self) -> None:
        xml = _generate(self._MAPPING, {})

        assert xml == (
            "<?xml version='1.0' encoding='utf-8'?>\n"
            '<Form:Root xmlns:Form="urn:form" xmlns:lib="urn:lib"'
            ' xmlns:att="http://apply.grants.gov/system/Attachments-V1.0" Form:Flag="">\n'
            "  <Form:DateReceived/>\n"
            "  <Form:Wrapper/>\n"
            "</Form:Root>"
        )

    def test_writes_the_value_when_there_is_one(self) -> None:
        xml = _generate(self._MAPPING, {"date_received": "2025-01-15"})

        assert "<Form:DateReceived>2025-01-15</Form:DateReceived>" in xml


class TestTransform:
    """Each transform's results and errors, mirrored in the form library's runtime tests
    (forms/emitters/xml/test/generate.test.ts). ``Exception`` is an error."""

    @pytest.mark.parametrize(
        "name,value,params,expected",
        [
            ("boolean_to_yes_no", True, {}, "Y: Yes"),
            ("boolean_to_yes_no", "no", {}, "N: No"),
            ("boolean_to_yes_no", "maybe", {}, Exception),
            ("boolean_to_yes_no", True, {"strict": True}, Exception),
            ("currency_format", "1", {}, "1.00"),
            ("currency_format", "-.50", {}, "-0.50"),
            ("currency_format", "007", {}, "7.00"),
            ("currency_format", "1.5", {}, Exception),
            ("currency_format", "-", {}, Exception),
            ("currency_format", 12, {}, Exception),
            ("string_case", "o'neil mcDONALD 3rd", {"case_type": "title"}, "O'Neil Mcdonald 3Rd"),
            ("string_case", "abc", {"case_type": "upper"}, "ABC"),
            ("string_case", "abc", {"case_type": "camel"}, Exception),
            ("string_case", "abc", {}, Exception),
            ("truncate_string", "abcdef", {"max_length": 3}, "abc"),
            ("truncate_string", "a\U0001f600bc", {"max_length": 2}, "a\U0001f600"),
            ("truncate_string", "ab", {"max_length": -1}, Exception),
            ("map_values", True, {"mappings": {"True": "T"}}, "T"),
            ("map_values", 2, {"mappings": {"2": "two"}}, "two"),
            ("map_values", "z", {"mappings": {}, "default": "D"}, "D"),
            ("map_values", "z", {"mappings": {}, "passthrough_unknown": True}, "z"),
            ("map_values", "z", {"mappings": {}}, Exception),
            ("join_values", ["C", "A"], {}, "CA"),
            ("join_values", ["C", "A"], {"sort": True, "separator": ","}, "A,C"),
            ("join_values", ["A", 1], {}, Exception),
        ],
    )
    def test_matches_the_form_librarys_runtime(
        self, name: str, value: Any, params: dict[str, Any], expected: Any
    ) -> None:
        mapping = _small_mapping(
            {"V": {"$transform": {"name": name, "value": {"$field": "v"}, "params": params}}}
        )

        if expected is Exception:
            # A parameter the transform doesn't take is a TypeError, as a keyword argument.
            with pytest.raises((ValueTransformationError, TypeError)):
                _generate(mapping, {"v": value})
        else:
            assert f"<Form:V>{expected}</Form:V>" in _generate(mapping, {"v": value})


class TestEach:
    def test_repeats_an_element_per_item_with_paths_relative_to_it(self) -> None:
        mapping = _small_mapping(
            {
                "Person": {
                    "$each": {
                        "items": {"$field": "people"},
                        "map": {"Profile": {"lib:FirstName": {"$field": "name.first"}}},
                    }
                }
            }
        )

        xml = _generate(
            mapping, {"people": [{"name": {"first": "Ada"}}, {"name": {"first": "Bo"}}]}
        )

        assert xml.count("<Form:Person>") == 2
        assert xml.index("Ada") < xml.index("Bo")
        assert "<Form:Profile>" in xml


class TestWhen:
    _MAPPING = _small_mapping(
        {
            "Kind": {
                "$when": {
                    "condition": {"field": "type", "operator": "equals", "value": "a"},
                    "then": {"$const": "Alpha"},
                    "else": {"$const": "Other"},
                }
            },
            "Extra": {
                "$when": {
                    "condition": {
                        "all": [
                            {"field": "type", "operator": "in", "value": ["a", "b"]},
                            {"field": "extra", "operator": "exists"},
                        ]
                    },
                    "then": {"$field": "extra"},
                }
            },
        }
    )

    def test_writes_then_when_the_condition_holds(self) -> None:
        xml = _generate(self._MAPPING, {"type": "a", "extra": "x"})

        assert "<Form:Kind>Alpha</Form:Kind>" in xml
        assert "<Form:Extra>x</Form:Extra>" in xml

    def test_writes_else_or_nothing_when_it_does_not(self) -> None:
        xml = _generate(self._MAPPING, {"type": "c", "extra": "x"})

        assert "<Form:Kind>Other</Form:Kind>" in xml
        assert "Extra" not in xml

    def test_writes_one_element_per_option_a_list_contains_or_does_not(self) -> None:
        def option(code: str) -> dict[str, Any]:
            return {
                "$when": {
                    "condition": {"field": "options", "operator": "contains", "value": code},
                    "then": "Y: Yes",
                    "else": "N: No",
                }
            }

        mapping = _small_mapping(
            {
                "OptionA": option("a"),
                "OptionB": option("b"),
                "NoneChosen": {
                    "$when": {
                        "condition": {"not": {"field": "options", "operator": "exists"}},
                        "then": "Y: Yes",
                    }
                },
                "Single": {
                    "$when": {
                        "condition": {"field": "single", "operator": "contains", "value": "a"},
                        "then": "Y: Yes",
                    }
                },
            }
        )

        assert _generate(mapping, {"options": ["a"], "single": "a"}) == (
            "<?xml version='1.0' encoding='utf-8'?>\n"
            '<Form:Root xmlns:Form="urn:form" xmlns:lib="urn:lib"'
            ' xmlns:att="http://apply.grants.gov/system/Attachments-V1.0">\n'
            "  <Form:OptionA>Y: Yes</Form:OptionA>\n"
            "  <Form:OptionB>N: No</Form:OptionB>\n"
            "</Form:Root>"
        )
        assert "<Form:NoneChosen>Y: Yes</Form:NoneChosen>" in _generate(mapping, {})

    def test_compares_answers_as_the_form_librarys_runtime_does(self) -> None:
        mapping = _small_mapping(
            {
                "Equals": {
                    "$when": {
                        "condition": {"field": "flag", "operator": "equals", "value": 1},
                        "then": "1",
                    }
                },
                "Contains": {
                    "$when": {
                        "condition": {"field": "flags", "operator": "contains", "value": 1},
                        "then": "1",
                    }
                },
                "Count": {
                    "$when": {
                        "condition": {"field": "count", "operator": "in", "value": [1]},
                        "then": "1",
                    }
                },
            }
        )

        xml = _generate(mapping, {"flag": True, "flags": [True], "count": 1.0})

        assert "Equals" not in xml
        assert "Contains" not in xml
        assert "<Form:Count>1</Form:Count>" in xml

    def test_rejects_an_unknown_operator(self) -> None:
        mapping = _small_mapping(
            {
                "A": {
                    "$when": {
                        "condition": {"field": "a", "operator": "near"},
                        "then": {"$const": 1},
                    }
                }
            }
        )

        with pytest.raises(ValueError, match="Unknown condition operator: near"):
            _generate(mapping, {})


class TestAttachment:
    _MAPPING = _small_mapping(
        {
            "Person": {
                "$each": {
                    "items": {"$field": "people"},
                    "map": {"Sketches": {"Sketch": {"$attachment": "sketch"}}},
                }
            }
        }
    )

    def test_writes_an_upload_inside_a_list_item(self) -> None:
        xml = _generate(
            self._MAPPING,
            {"people": [{"sketch": _ADDITIONAL_LOCATIONS}]},
            attachment_mapping={_ADDITIONAL_LOCATIONS: _ADDITIONAL_LOCATIONS_FILE},
        )

        sketch = xml[xml.index("<Form:Sketch>") : xml.index("</Form:Sketch>")]
        assert "<att:FileName>additional_locations.pdf</att:FileName>" in sketch

    def test_rejects_an_upload_the_application_does_not_have(self) -> None:
        with pytest.raises(ValueError, match="not found in attachment mapping"):
            _generate(self._MAPPING, {"people": [{"sketch": "unknown"}]})

    def test_reads_dot_as_the_item_itself_for_a_list_of_upload_ids(self) -> None:
        other = "11111111-2222-3333-4444-555555555555"
        mapping = _small_mapping(
            {
                "OtherAttachments": {
                    "OtherAttachment": {
                        "$each": {
                            "items": {"$field": "other_attachments"},
                            "map": {"$attachment": "."},
                        }
                    }
                },
                "Code": {"$each": {"items": {"$field": "codes"}, "map": {"$field": "."}}},
            }
        )

        xml = _generate(
            mapping,
            {"other_attachments": [_ADDITIONAL_LOCATIONS, other], "codes": ["X", "Y"]},
            attachment_mapping={
                _ADDITIONAL_LOCATIONS: _ADDITIONAL_LOCATIONS_FILE,
                other: AttachmentInfo(
                    filename="other.pdf",
                    mime_type="application/pdf",
                    file_location="other.pdf",
                    hash_value="hash",
                ),
            },
        )

        assert xml.count("<Form:OtherAttachment>") == 2
        assert xml.index("additional_locations.pdf") < xml.index("other.pdf")
        assert "<Form:Code>X</Form:Code>\n  <Form:Code>Y</Form:Code>" in xml


class TestService:
    def test_uses_the_new_generator_only_for_a_mapping_in_this_format(self) -> None:
        mapping = _small_mapping({"Title": {"$field": "title"}})

        response = XMLGenerationService().generate_xml(
            XMLGenerationRequest(application_data={"title": "A"}, transform_config=mapping)
        )

        assert is_xml_mapping(mapping)
        assert not is_xml_mapping({"_xml_config": {}})
        assert response.success, response.error_message
        assert "<Form:Title>A</Form:Title>" in (response.xml_data or "")


class TestNesting:
    def test_a_case_entry_can_be_a_when(self) -> None:
        mapping = _small_mapping(
            {
                "Status": {
                    "$match": {
                        "value": {"$field": "status"},
                        "case": {
                            "open": "Open",
                            "closed": {
                                "$when": {
                                    "condition": {"field": "reason", "operator": "exists"},
                                    "then": {"$field": "reason"},
                                    "else": "Closed",
                                }
                            },
                        },
                    }
                }
            }
        )

        assert "<Form:Status>Open</Form:Status>" in _generate(mapping, {"status": "open"})
        assert "<Form:Status>Withdrawn</Form:Status>" in _generate(
            mapping, {"status": "closed", "reason": "Withdrawn"}
        )
        assert "<Form:Status>Closed</Form:Status>" in _generate(mapping, {"status": "closed"})

    def test_a_case_entry_can_be_a_group_of_elements(self) -> None:
        mapping = _small_mapping(
            {
                "Applicant": {
                    "$match": {
                        "value": {"$field": "kind"},
                        "case": {"person": {"lib:FirstName": {"$field": "first_name"}}},
                        "default": {"OrganizationName": {"$field": "organization"}},
                    }
                }
            }
        )

        person = _generate(mapping, {"kind": "person", "first_name": "Ada"})
        organization = _generate(mapping, {"kind": "org", "organization": "Acme"})

        assert "<Form:Applicant>" in person and "<lib:FirstName>Ada</lib:FirstName>" in person
        assert "<Form:OrganizationName>Acme</Form:OrganizationName>" in organization

    def test_a_match_can_read_a_transformed_value(self) -> None:
        mapping = _small_mapping(
            {
                "Code": {
                    "$match": {
                        "value": {
                            "$transform": {"name": "boolean_to_yes_no", "value": {"$field": "ok"}}
                        },
                        "case": {"Y: Yes": "1", "N: No": "0"},
                    }
                }
            }
        )

        assert "<Form:Code>1</Form:Code>" in _generate(mapping, {"ok": True})

    def test_each_can_read_its_list_from_any_value(self) -> None:
        mapping = _small_mapping(
            {
                "Site": {
                    "$each": {
                        "items": {
                            "$when": {
                                "condition": {
                                    "field": "has_sites",
                                    "operator": "equals",
                                    "value": True,
                                },
                                "then": {"$field": "sites"},
                            }
                        },
                        "map": {"Name": {"$field": "name"}},
                    }
                }
            }
        )

        data = {"sites": [{"name": "A"}, {"name": "B"}]}
        assert _generate(mapping, {**data, "has_sites": True}).count("<Form:Site>") == 2
        assert "Site" not in _generate(mapping, {**data, "has_sites": False})


class TestMappedRootFields:
    def test_lists_the_top_level_fields_a_mapping_reads(self) -> None:
        nested = _small_mapping(
            {"A": {"$match": {"value": {"$field": "kind"}, "case": {"x": {"$field": "other"}}}}}
        )
        assert mapped_root_fields(nested) == {"kind", "other"}
        combined = _small_mapping(
            {
                "A": {
                    "$when": {
                        "condition": {
                            "all": [
                                {"field": "a.b", "operator": "exists"},
                                {"not": {"field": "c", "operator": "exists"}},
                            ]
                        },
                        "then": "x",
                    }
                }
            }
        )
        assert mapped_root_fields(combined) == {"a", "c"}
        assert mapped_root_fields(_mapping("performance_sites")) == {
            "primary_site",
            "additional_sites",
            "additional_locations_attachment",
        }
