"""Tests for the checks in `compare.mapping_vs_xsd` over hand-built forms."""

from tests.src.form_schema.parity.discrepancy import DiscrepancyKind
from tests.src.form_schema.parity.xml.harness.compare import mapping_vs_xsd
from tests.src.form_schema.parity.xml.harness.utils import element, flat


class TestUndeclaredTargets:
    def test_accepts_target_xsd_declares(self):
        form = flat(targets={("Applicant",): "applicant"}, xsd_elements={("Applicant",): element()})
        assert not mapping_vs_xsd.undeclared_targets(form)

    def test_flags_misspelled_target(self):
        form = flat(targets={("Aplicant",): "applicant"}, xsd_elements={("Applicant",): element()})
        assert [d.path for d in mapping_vs_xsd.undeclared_targets(form)] == ["Aplicant"]

    def test_flags_target_at_wrong_level(self):
        form = flat(
            targets={("Street1",): "street1"},
            xsd_elements={("Applicant", "Street1"): element()},
        )
        assert [d.path for d in mapping_vs_xsd.undeclared_targets(form)] == ["Street1"]


class TestUnsourcedElements:
    def test_accepts_required_element_with_source(self):
        form = flat(
            targets={("Applicant",): "applicant"},
            xsd_elements={("Applicant",): element(required=True)},
        )
        assert not mapping_vs_xsd.unsourced_elements(form)

    def test_flags_required_element_without_source(self):
        form = flat(xsd_elements={("Applicant",): element(required=True)})
        assert [d.path for d in mapping_vs_xsd.unsourced_elements(form)] == ["Applicant"]

    def test_accepts_optional_element_without_source(self):
        form = flat(xsd_elements={("Applicant",): element(required=False)})
        assert not mapping_vs_xsd.unsourced_elements(form)

    def test_accepts_element_under_attachment(self):
        form = flat(
            xsd_elements={("Attachments", "FileName"): element(required=True)},
            attachments=frozenset({"Attachments"}),
        )
        assert not mapping_vs_xsd.unsourced_elements(form)


class TestOutOfOrderElements:
    def test_accepts_elements_in_xsd_order(self):
        form = flat(
            targets={("A",): "a", ("B",): "b"},
            xsd_elements={("A",): element(position=0), ("B",): element(position=1)},
        )
        assert not mapping_vs_xsd.out_of_order_elements(form)

    def test_flags_siblings_in_wrong_order(self):
        form = flat(
            targets={("B",): "b", ("A",): "a"},
            xsd_elements={("A",): element(position=0), ("B",): element(position=1)},
        )
        found = mapping_vs_xsd.out_of_order_elements(form)
        assert [(d.kind, d.path) for d in found] == [
            (DiscrepancyKind.ELEMENTS_OUT_OF_SEQUENCE, "(root)")
        ]

    def test_ignores_order_across_parents(self):
        form = flat(
            targets={("Y", "B"): "b", ("X", "A"): "a"},
            xsd_elements={("X", "A"): element(position=0), ("Y", "B"): element(position=0)},
        )
        assert not mapping_vs_xsd.out_of_order_elements(form)

    def test_ignores_attributes(self):
        form = flat(
            targets={("B",): "b", ("@id",): "identifier"},
            xsd_elements={("@id",): element(position=-1), ("B",): element(position=0)},
        )
        assert not mapping_vs_xsd.out_of_order_elements(form)
