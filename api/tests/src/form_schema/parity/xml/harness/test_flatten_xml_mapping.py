"""Tests for `flatten_xml_mapping` over hand-built mappings shaped like the XML."""

from tests.src.form_schema.parity.xml.harness import flatten_transform, flatten_xml_mapping


def mapping(content: dict) -> dict:
    return {
        "format": "xml-mapping",
        "namespaces": {"default": "urn:form", "Form": "urn:form", "globLib": "urn:lib"},
        "xsd_url": "https://example.gov/schemas/Form_1_0-V1.0.xsd",
        "root": {"Form_1_0": content},
    }


PERSON = mapping(
    {
        "@Form:FormVersion": {"$const": "1.0"},
        "Title": {"$field": "title"},
        "Person": {
            "$each": {
                "items": {"$field": "people"},
                "map": {
                    "Profile": {
                        "globLib:FirstName": {"$field": "name.first_name"},
                        "Individual": {
                            "$transform": {
                                "name": "boolean_to_yes_no",
                                "value": {"$field": "individual"},
                            }
                        },
                        "Sketches": {"Sketch": {"$attachment": "sketch"}},
                    }
                },
            }
        },
    }
)


class TestRead:
    def test_reads_every_element_with_its_field(self):
        targets, unchecked = flatten_xml_mapping.read(PERSON)
        assert targets == {
            ("@FormVersion",): None,
            ("Title",): "title",
            ("Person",): None,
            ("Person", "Profile"): None,
            ("Person", "Profile", "FirstName"): "people.[].name.first_name",
            ("Person", "Profile", "Individual"): "people.[].individual",
            ("Person", "Profile", "Sketches"): None,
            ("Person", "Profile", "Sketches", "Sketch"): "people.[].sketch",
        }
        assert unchecked == {}

    def test_reads_both_branches_of_when(self):
        targets, _ = flatten_xml_mapping.read(
            mapping(
                {
                    "Kind": {
                        "$when": {
                            "condition": {"field": "type", "operator": "exists"},
                            "then": {"$field": "type"},
                            "else": {"$const": "None"},
                        }
                    }
                }
            )
        )
        assert targets == {("Kind",): "type"}

    def test_matches_the_transform_rules_for_the_same_elements(self):
        rules = {
            "_xml_config": {"xml_structure": {"root_element": "Form_1_0"}},
            "title": {"xml_transform": {"target": "Title"}},
            "people": {
                "xml_transform": {"target": "Person", "type": "array"},
                "items": {
                    "name": {
                        "xml_transform": {"target": "Name", "type": "nested_object"},
                        "first_name": {"xml_transform": {"target": "FirstName"}},
                    }
                },
            },
        }
        same = mapping(
            {
                "Title": {"$field": "title"},
                "Person": {
                    "$each": {
                        "items": {"$field": "people"},
                        "map": {"Name": {"FirstName": {"$field": "name.first_name"}}},
                    }
                },
            }
        )
        assert flatten_xml_mapping.read(same) == flatten_transform.read(rules)

    def test_reads_match_from_its_value(self):
        matched = mapping(
            {
                "Individual": {
                    "$match": {"value": {"$field": "individual"}, "case": {"true": "Y: Yes"}}
                }
            }
        )
        assert flatten_xml_mapping.read(matched) == ({("Individual",): "individual"}, {})
        assert flatten_xml_mapping.transformed(matched) == {
            ("Individual",): frozenset({"map_values"})
        }


class TestDocument:
    def test_reads_root_and_xsd(self):
        assert flatten_xml_mapping.root_of(PERSON) == "Form_1_0"
        assert flatten_xml_mapping.xsd_of(PERSON) == "Form_1_0-V1.0.xsd"

    def test_reads_attachments_and_transforms(self):
        assert flatten_xml_mapping.attachment_elements(PERSON) == frozenset({"Sketch"})
        assert flatten_xml_mapping.transformed(PERSON) == {
            ("Person", "Profile", "Individual"): frozenset({"boolean_to_yes_no"})
        }
