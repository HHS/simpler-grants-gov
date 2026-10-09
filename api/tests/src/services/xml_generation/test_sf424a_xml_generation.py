"""Tests for SF-424A (Budget Information - Non-Construction) XML generation.

XSD Reference: https://apply07.grants.gov/apply/forms/schemas/SF424A-V1.0.xsd

SF-424A is built from three transforms that the other forms barely use:
- array_decomposition turns the row-based activity_line_items into the
  column-based sections (BudgetSummary, BudgetCategories, NonFederalResources,
  FederalFundsNeeded), with one line item per row plus a totals element.
- pivot_object turns forecasted_cash_needs (federal / non-federal / total rows)
  into the quarter-based BudgetForecastedCashNeeds element (Section D).
- compose_object wraps the three explanation fields into OtherInformation
  (Section F).
All of the XSD sequences are strict, so element order matters as much as values.
"""

from pathlib import Path
from typing import Any

import pytest
from lxml import etree as lxml_etree

from src.form_schema.forms import init_form_registry
from src.form_schema.forms.sf424a import FORM_JSON_SCHEMA, FORM_XML_TRANSFORM_RULES, SF424a_v1_0
from src.form_schema.jsonschema_validator import validate_json_schema_for_form
from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService
from src.services.xml_generation.validation.xsd_validator import XSDValidator
from tests.src.form_schema.forms.conftest import setup_resolved_form

XSD_DIR = Path(__file__).parents[4] / "src/services/xml_generation/xsds"
XSD_NAME = "SF424A-V1.0"
SF424A_NS = "http://apply.grants.gov/forms/SF424A-V1.0"
NS = {"SF424A": SF424A_NS, "glob": "http://apply.grants.gov/system/Global-V1.0"}
XSD_NS = {"xsd": "http://www.w3.org/2001/XMLSchema"}
ACTIVITY_TITLE_ATTR = f"{{{SF424A_NS}}}activityTitle"

# Line item sections built from activity_line_items: XML section -> (line item, totals)
LINE_ITEM_SECTIONS = {
    "BudgetSummary": ("SummaryLineItem", "SummaryTotals"),
    "BudgetCategories": ("CategorySet", "CategoryTotals"),
    "NonFederalResources": ("ResourceLineItem", "ResourceTotals"),
    "FederalFundsNeeded": ("FundsLineItem", "FundsTotals"),
}

QUARTER_ELEMENTS = {
    "BudgetFirstYearAmounts": "total_amount",
    "BudgetFirstQuarterAmounts": "first_quarter_amount",
    "BudgetSecondQuarterAmounts": "second_quarter_amount",
    "BudgetThirdQuarterAmounts": "third_quarter_amount",
    "BudgetFourthQuarterAmounts": "fourth_quarter_amount",
}
FORECAST_ROWS = {
    "BudgetFederalForecastedAmount": "federal_forecasted_cash_needs",
    "BudgetNonFederalForecastedAmount": "non_federal_forecasted_cash_needs",
    "BudgetTotalForecastedAmount": "total_forecasted_cash_needs",
}


def _amount(row: int, column: int) -> str:
    """A value that is unique per row and column, so a misplaced value is caught."""
    return f"{row}{column:02d}.00"


def _row(row: int, **overrides: Any) -> dict:
    """One activity line item with every leaf field filled in."""
    item = {
        "activity_title": f"Activity {row}",
        "assistance_listing_number": f"93.00{row}",
        "budget_summary": {
            "federal_estimated_unobligated_amount": _amount(row, 1),
            "non_federal_estimated_unobligated_amount": _amount(row, 2),
            "federal_new_or_revised_amount": _amount(row, 3),
            "non_federal_new_or_revised_amount": _amount(row, 4),
            "total_amount": _amount(row, 5),
        },
        "budget_categories": {
            "personnel_amount": _amount(row, 10),
            "fringe_benefits_amount": _amount(row, 11),
            "travel_amount": _amount(row, 12),
            "equipment_amount": _amount(row, 13),
            "supplies_amount": _amount(row, 14),
            "contractual_amount": _amount(row, 15),
            "construction_amount": _amount(row, 16),
            "other_amount": _amount(row, 17),
            "total_direct_charge_amount": _amount(row, 18),
            "total_indirect_charge_amount": _amount(row, 19),
            "total_amount": _amount(row, 20),
            "program_income_amount": _amount(row, 21),
        },
        "non_federal_resources": {
            "grant_program": f"Resources {row}",
            "applicant_amount": _amount(row, 30),
            "state_amount": _amount(row, 31),
            "other_amount": _amount(row, 32),
            "total_amount": _amount(row, 33),
        },
        "federal_fund_estimates": {
            "grant_program": f"Funds {row}",
            "first_year_amount": _amount(row, 40),
            "second_year_amount": _amount(row, 41),
            "third_year_amount": _amount(row, 42),
            "fourth_year_amount": _amount(row, 43),
        },
    }
    item.update(overrides)
    return item


def _forecast(row: int) -> dict:
    return {
        "first_quarter_amount": _amount(row, 50),
        "second_quarter_amount": _amount(row, 51),
        "third_quarter_amount": _amount(row, 52),
        "fourth_quarter_amount": _amount(row, 53),
        "total_amount": _amount(row, 54),
    }


def _application(rows: int) -> dict:
    """An application with `rows` fully filled rows and every total and section."""
    totals = _row(9)
    return {
        "activity_line_items": [_row(row) for row in range(1, rows + 1)],
        "total_budget_summary": totals["budget_summary"],
        "total_budget_categories": totals["budget_categories"],
        "total_non_federal_resources": totals["non_federal_resources"],
        "total_federal_fund_estimates": totals["federal_fund_estimates"],
        "forecasted_cash_needs": {
            "federal_forecasted_cash_needs": _forecast(6),
            "non_federal_forecasted_cash_needs": _forecast(7),
            "total_forecasted_cash_needs": _forecast(8),
        },
        "direct_charges_explanation": "Direct charges explained",
        "indirect_charges_explanation": "Provisional rate",
        "remarks": "No further remarks",
        "confirmation": True,
    }


# Only what the JSON schema requires: one row with its activity title, and confirmation
SCHEMA_MINIMAL_APPLICATION = {
    "activity_line_items": [{"activity_title": "Activity 1"}],
    "confirmation": True,
}

# Top-level schema fields that are intentionally not written to the XML
FIELDS_NOT_IN_XML = {
    # The "Is this form complete?" checkbox only exists in our UI, the XSD has no element for it
    "confirmation",
}

MINIMAL_APPLICATION = {
    "activity_line_items": [
        {
            "activity_title": "Activity 1",
            "budget_summary": {"federal_new_or_revised_amount": "100.00"},
        }
    ],
    "confirmation": True,
}


@pytest.fixture(scope="module")
def xsd_validator() -> XSDValidator:
    init_form_registry()
    return XSDValidator(XSD_DIR)


def _generate(application_data: dict) -> str:
    response = XMLGenerationService().generate_xml(
        XMLGenerationRequest(
            application_data=application_data,
            transform_config=FORM_XML_TRANSFORM_RULES,
            pretty_print=True,
        )
    )
    assert response.success, response.error_message
    assert response.xml_data is not None
    return response.xml_data


def _root(xml_data: str) -> lxml_etree._Element:
    return lxml_etree.fromstring(xml_data.encode("utf-8"))


def _xsd_result(xsd_validator: XSDValidator, xml_data: str) -> dict:
    return xsd_validator.validate_xml_for_form(xml_data, XSD_NAME)


def _assert_xsd_valid(xsd_validator: XSDValidator, xml_data: str) -> None:
    result = _xsd_result(xsd_validator, xml_data)
    assert result["valid"], result["error_message"]


def _local_names(element: lxml_etree._Element) -> list[str]:
    return [lxml_etree.QName(child).localname for child in element]


def _titles(root: lxml_etree._Element, section: str) -> list[str | None]:
    line_item = LINE_ITEM_SECTIONS[section][0]
    return [
        item.get(ACTIVITY_TITLE_ATTR)
        for item in root.findall(f"SF424A:{section}/SF424A:{line_item}", NS)
    ]


# Sections A and B use the row's activity_title, C and E use their own Column A
TITLE_PREFIX = {
    "BudgetSummary": "Activity",
    "BudgetCategories": "Activity",
    "NonFederalResources": "Resources",
    "FederalFundsNeeded": "Funds",
}


def _expected_titles(section: str, rows: int) -> list[str]:
    """Titles _row() gives each line item of a section, for rows 1..rows."""
    return [f"{TITLE_PREFIX[section]} {row}" for row in range(1, rows + 1)]


def _xsd_sequence(xpath: str) -> list[str]:
    """Element names, in order, of the xsd:sequence found at `xpath` in the SF424A XSD."""
    xsd = lxml_etree.parse(str(XSD_DIR / f"{XSD_NAME}.xsd"))
    return [
        element.get("ref").split(":")[-1]
        for element in xsd.findall(f"{xpath}/xsd:sequence/xsd:element", XSD_NS)
    ]


def _extract_referenced_fields(rule: dict) -> set[str]:
    """Every JSON schema field a transform rule pulls data from, whatever its type.

    Each conditional_transform type keeps its source fields under different keys
    (pivot_object even uses dotted paths), so each shape is handled explicitly.
    """
    referenced: set[str] = set()

    def add_field(value: Any) -> None:
        if isinstance(value, str):
            referenced.add(value.split(".")[0])

    def walk(node: Any) -> None:
        if not isinstance(node, dict):
            return
        transform_type = node.get("type")
        if transform_type in ("compose_object", "field_grouping"):
            for value in node.get("field_mapping", {}).values():
                add_field(value)
            for value in node.get("source_fields", []):
                add_field(value)
        elif transform_type == "pivot_object":
            add_field(node.get("source_field"))
            for group in node.get("field_mapping", {}).values():
                if isinstance(group, dict):
                    for value in group.values():
                        add_field(value)
        elif transform_type == "array_decomposition":
            add_field(node.get("source_array_field"))
            for mapping in node.get("field_mappings", {}).values():
                add_field(mapping.get("item_field"))
                add_field(mapping.get("total_field"))
                for attribute in mapping.get("item_attributes", []):
                    add_field(attribute)
                for parent_field in mapping.get("item_parent_fields", []):
                    add_field(parent_field)
        elif transform_type == "one_to_many":
            add_field(node.get("source_field"))
        for key in ("xml_transform", "conditional_transform"):
            if key in node:
                walk(node[key])

    walk(rule)
    return referenced


def _json_issues(application_data: dict) -> list[tuple[str, str]]:
    form = setup_resolved_form(SF424a_v1_0)
    return [
        (issue.field, issue.type) for issue in validate_json_schema_for_form(application_data, form)
    ]


###################################
# Guardrail: every schema field has an XML mapping
###################################


def test_all_schema_fields_have_xml_mapping():
    """A new schema field without a transform rule would be silently dropped from the XML."""
    schema_fields = set(FORM_JSON_SCHEMA["properties"])
    mapped_fields = set(FORM_XML_TRANSFORM_RULES)
    for rule in FORM_XML_TRANSFORM_RULES.values():
        mapped_fields |= _extract_referenced_fields(rule)

    unmapped = schema_fields - mapped_fields - FIELDS_NOT_IN_XML
    assert not unmapped, f"Schema fields with no XML mapping: {unmapped}"


def test_fields_not_in_xml_are_really_unmapped():
    """Keeps the exemption list honest: anything on it must exist and have no rule."""
    assert FIELDS_NOT_IN_XML <= set(FORM_JSON_SCHEMA["properties"])
    assert not FIELDS_NOT_IN_XML & set(FORM_XML_TRANSFORM_RULES)


###################################
# Root and minimal case
###################################


def test_root_element_and_attributes(xsd_validator):
    xml_data = _generate(MINIMAL_APPLICATION)
    root = _root(xml_data)

    assert root.tag == f"{{{SF424A_NS}}}BudgetInformation"
    assert root.get(f"{{{SF424A_NS}}}programType") == "Non-Construction"
    assert root.get(f"{{{NS['glob']}}}coreSchemaVersion") == "1.0"
    assert root.findtext("glob:FormVersionIdentifier", namespaces=NS) == "1.0"
    assert root.nsmap["SF424A"] == SF424A_NS
    assert root.nsmap["glob"] == NS["glob"]
    _assert_xsd_valid(xsd_validator, xml_data)


def test_schema_minimal_application_validates(xsd_validator):
    """Only the JSON-schema-required fields. Like legacy, Sections B, C and E still list the
    activity as an empty line item, with no amounts and no totals."""
    assert _json_issues(SCHEMA_MINIMAL_APPLICATION) == []

    xml_data = _generate(SCHEMA_MINIMAL_APPLICATION)
    root = _root(xml_data)

    assert _local_names(root) == [
        "FormVersionIdentifier",
        "BudgetCategories",
        "NonFederalResources",
        "FederalFundsNeeded",
    ]
    for section in ("BudgetCategories", "NonFederalResources", "FederalFundsNeeded"):
        line_item = LINE_ITEM_SECTIONS[section][0]
        assert _local_names(root.find(f"SF424A:{section}", NS)) == [line_item]
        assert _titles(root, section) == ["Activity 1"]
    _assert_xsd_valid(xsd_validator, xml_data)


def test_optional_sections_omitted_when_not_provided(xsd_validator):
    """Only values that were provided are written. The only empty elements are the line
    items legacy writes for an activity in a section left empty."""
    xml_data = _generate(MINIMAL_APPLICATION)
    root = _root(xml_data)

    assert _local_names(root) == [
        "FormVersionIdentifier",
        "BudgetSummary",
        "BudgetCategories",
        "NonFederalResources",
        "FederalFundsNeeded",
    ]
    # No totals were entered, so there is no SummaryTotals either
    assert _local_names(root.find("SF424A:BudgetSummary", NS)) == ["SummaryLineItem"]
    assert _local_names(root.find("SF424A:BudgetSummary/SF424A:SummaryLineItem", NS)) == [
        "BudgetFederalNewOrRevisedAmount"
    ]
    empty_line_items = {"CategorySet", "ResourceLineItem", "FundsLineItem"}
    for element in root.iter():
        name = lxml_etree.QName(element).localname
        if name in empty_line_items:
            assert len(element) == 0 and element.get(ACTIVITY_TITLE_ATTR) == "Activity 1"
        else:
            assert len(element) > 0 or (element.text or "").strip(), f"Empty element: {name}"
    _assert_xsd_valid(xsd_validator, xml_data)


def test_row_with_no_section_data_is_skipped(xsd_validator):
    """A row with nothing entered produces no line items (and no title is needed)."""
    application = {
        "activity_line_items": [_row(1), {}],
        "confirmation": True,
    }
    assert _json_issues(application) == []

    xml_data = _generate(application)
    root = _root(xml_data)

    for section in LINE_ITEM_SECTIONS:
        assert _titles(root, section) == _expected_titles(section, 1)
    _assert_xsd_valid(xsd_validator, xml_data)


def test_rows_left_empty_after_pre_population_are_skipped(xsd_validator):
    """Pre-population adds "0.00" totals to every row, even ones the user never touched.
    Those rows have no title, so they must not turn into (invalid) line items."""
    empty_row_after_pre_population = {
        "budget_categories": {"total_direct_charge_amount": "0.00", "total_amount": "0.00"},
        "non_federal_resources": {"total_amount": "0.00"},
    }
    application = {
        "activity_line_items": [_row(1)] + [dict(empty_row_after_pre_population)] * 3,
        "confirmation": True,
    }
    assert _json_issues(application) == []

    xml_data = _generate(application)
    root = _root(xml_data)

    for section in LINE_ITEM_SECTIONS:
        assert _titles(root, section) == _expected_titles(section, 1)
    _assert_xsd_valid(xsd_validator, xml_data)


###################################
# Section A Column B - CFDANumber
###################################


def test_assistance_listing_number_written_as_cfda_number(xsd_validator):
    """Column B is entered on the row, and lands first inside that row's SummaryLineItem."""
    xml_data = _generate(_application(2))
    line_items = _root(xml_data).findall("SF424A:BudgetSummary/SF424A:SummaryLineItem", NS)

    assert [item.findtext("SF424A:CFDANumber", namespaces=NS) for item in line_items] == [
        "93.001",
        "93.002",
    ]
    assert all(_local_names(item)[0] == "CFDANumber" for item in line_items)
    _assert_xsd_valid(xsd_validator, xml_data)


def test_assistance_listing_number_alone_creates_summary_line_item(xsd_validator):
    application = {
        "activity_line_items": [
            {"activity_title": "Activity 1", "assistance_listing_number": "93.001"}
        ],
        "confirmation": True,
    }
    xml_data = _generate(application)
    line_item = _root(xml_data).find("SF424A:BudgetSummary/SF424A:SummaryLineItem", NS)

    assert line_item.get(ACTIVITY_TITLE_ATTR) == "Activity 1"
    assert _local_names(line_item) == ["CFDANumber"]
    _assert_xsd_valid(xsd_validator, xml_data)


def test_cfda_number_omitted_when_not_provided():
    row = _row(1)
    del row["assistance_listing_number"]
    root = _root(_generate({"activity_line_items": [row], "confirmation": True}))

    assert root.find(".//SF424A:CFDANumber", NS) is None


###################################
# Multiple rows and the 4 row boundary
###################################


@pytest.mark.parametrize("rows", [1, 2, 3, 4])
def test_each_row_becomes_a_line_item_in_every_section(xsd_validator, rows):
    xml_data = _generate(_application(rows))
    root = _root(xml_data)

    for section, (line_item, totals) in LINE_ITEM_SECTIONS.items():
        assert _titles(root, section) == _expected_titles(section, rows)
        # Line items always come first, then the single totals element
        assert _local_names(root.find(f"SF424A:{section}", NS)) == [line_item] * rows + [totals]
    _assert_xsd_valid(xsd_validator, xml_data)


def test_four_rows_every_value_lands_in_the_right_line_item(xsd_validator):
    """With all fields filled on all 4 rows, each value ends up in its own row and element."""
    application = _application(4)
    xml_data = _generate(application)
    root = _root(xml_data)

    expected_elements = {
        "BudgetSummary": {
            "BudgetFederalEstimatedUnobligatedAmount": "federal_estimated_unobligated_amount",
            "BudgetNonFederalEstimatedUnobligatedAmount": "non_federal_estimated_unobligated_amount",
            "BudgetFederalNewOrRevisedAmount": "federal_new_or_revised_amount",
            "BudgetNonFederalNewOrRevisedAmount": "non_federal_new_or_revised_amount",
            "BudgetTotalNewOrRevisedAmount": "total_amount",
        },
        "BudgetCategories": {
            "BudgetPersonnelRequestedAmount": "personnel_amount",
            "BudgetFringeBenefitsRequestedAmount": "fringe_benefits_amount",
            "BudgetTravelRequestedAmount": "travel_amount",
            "BudgetEquipmentRequestedAmount": "equipment_amount",
            "BudgetSuppliesRequestedAmount": "supplies_amount",
            "BudgetContractualRequestedAmount": "contractual_amount",
            "BudgetConstructionRequestedAmount": "construction_amount",
            "BudgetOtherRequestedAmount": "other_amount",
            "BudgetTotalDirectChargesAmount": "total_direct_charge_amount",
            "BudgetIndirectChargesAmount": "total_indirect_charge_amount",
            "BudgetTotalAmount": "total_amount",
            "ProgramIncomeAmount": "program_income_amount",
        },
        "NonFederalResources": {
            "BudgetApplicantContributionAmount": "applicant_amount",
            "BudgetStateContributionAmount": "state_amount",
            "BudgetOtherContributionAmount": "other_amount",
            "BudgetTotalContributionAmount": "total_amount",
        },
        "FederalFundsNeeded": {
            "BudgetFirstYearAmount": "first_year_amount",
            "BudgetSecondYearAmount": "second_year_amount",
            "BudgetThirdYearAmount": "third_year_amount",
            "BudgetFourthYearAmount": "fourth_year_amount",
        },
    }
    json_fields = {
        "BudgetSummary": ("budget_summary", "total_budget_summary"),
        "BudgetCategories": ("budget_categories", "total_budget_categories"),
        "NonFederalResources": ("non_federal_resources", "total_non_federal_resources"),
        "FederalFundsNeeded": ("federal_fund_estimates", "total_federal_fund_estimates"),
    }

    for section, elements in expected_elements.items():
        line_item, totals = LINE_ITEM_SECTIONS[section]
        item_field, total_field = json_fields[section]
        line_items = root.findall(f"SF424A:{section}/SF424A:{line_item}", NS)
        totals_element = root.find(f"SF424A:{section}/SF424A:{totals}", NS)

        for index, item in enumerate(line_items):
            row = application["activity_line_items"][index]
            source = row[item_field]
            if section == "BudgetSummary":
                # Column B sits on the row and comes first in the line item
                assert _local_names(item) == ["CFDANumber", *elements]
                assert item.findtext("SF424A:CFDANumber", namespaces=NS) == (
                    row["assistance_listing_number"]
                )
            else:
                assert _local_names(item) == list(elements)
            for xml_name, json_name in elements.items():
                assert item.findtext(f"SF424A:{xml_name}", namespaces=NS) == source[json_name]

        assert _local_names(totals_element) == list(elements)
        for xml_name, json_name in elements.items():
            assert (
                totals_element.findtext(f"SF424A:{xml_name}", namespaces=NS)
                == application[total_field][json_name]
            )

    _assert_xsd_valid(xsd_validator, xml_data)


def test_more_than_four_rows_is_rejected(xsd_validator):
    """The JSON schema stops a 5th row, and the XSD would reject it too."""
    application = _application(4)
    application["activity_line_items"].append(_row(5))

    assert ("$.activity_line_items", "maxItems") in _json_issues(application)
    assert not _xsd_result(xsd_validator, _generate(application))["valid"]


###################################
# activityTitle on the line items
###################################


SECTION_C_AND_E = {
    "NonFederalResources": "non_federal_resources",
    "FederalFundsNeeded": "federal_fund_estimates",
}


@pytest.mark.parametrize("section,item_field", SECTION_C_AND_E.items())
def test_sections_c_and_e_use_their_own_column_a(xsd_validator, section, item_field):
    """Sections C and E take the title from their own Column A (grant_program), never
    from the Section A activity title."""
    xml_data = _generate(_application(2))
    root = _root(xml_data)

    assert _titles(root, section) == _expected_titles(section, 2)
    # grant_program only drives the attribute, it is never written as an element
    assert "grant_program" not in xml_data
    assert root.find(f".//SF424A:{section}//SF424A:activityTitle", NS) is None
    _assert_xsd_valid(xsd_validator, xml_data)


@pytest.mark.parametrize("section,item_field", SECTION_C_AND_E.items())
@pytest.mark.parametrize("grant_program", [None, "", "   "])
def test_blank_column_a_with_amounts_written_as_na(
    xsd_validator, section, item_field, grant_program
):
    """Amounts entered in Section C or E with Column A left blank go out as "N/A", which
    is what the UI shows in that cell too."""
    first_row = _row(1)
    if grant_program is None:
        del first_row[item_field]["grant_program"]
    else:
        first_row[item_field]["grant_program"] = grant_program
    application = {"activity_line_items": [first_row], "confirmation": True}
    assert _json_issues(application) == []

    xml_data = _generate(application)

    assert _titles(_root(xml_data), section) == ["N/A"]
    _assert_xsd_valid(xsd_validator, xml_data)


@pytest.mark.parametrize("section,item_field", SECTION_C_AND_E.items())
def test_column_a_alone_creates_line_item(xsd_validator, section, item_field):
    """Column A is something the user entered, so it's enough to write the line item."""
    first_row = _row(1)
    first_row[item_field] = {"grant_program": "Column A Only"}
    xml_data = _generate({"activity_line_items": [first_row], "confirmation": True})
    line_item = _root(xml_data).find(
        f"SF424A:{section}/SF424A:{LINE_ITEM_SECTIONS[section][0]}", NS
    )

    assert line_item.get(ACTIVITY_TITLE_ATTR) == "Column A Only"
    _assert_xsd_valid(xsd_validator, xml_data)


@pytest.mark.parametrize("section,item_field", SECTION_C_AND_E.items())
def test_row_with_only_section_c_or_e_data(xsd_validator, section, item_field):
    """Rows 2-4 can have data in just Section C or E. No activity_title is needed, and the
    row shows up in that section only."""
    second_row = {item_field: _row(2)[item_field]}
    application = {"activity_line_items": [_row(1), second_row], "confirmation": True}
    assert _json_issues(application) == []

    xml_data = _generate(application)
    root = _root(xml_data)

    for other_section in LINE_ITEM_SECTIONS:
        expected_rows = 2 if other_section == section else 1
        assert _titles(root, other_section) == _expected_titles(other_section, expected_rows)
    _assert_xsd_valid(xsd_validator, xml_data)


SECTIONS_B_C_E = {
    "BudgetCategories": ("budget_categories", "total_budget_categories"),
    "NonFederalResources": ("non_federal_resources", "total_non_federal_resources"),
    "FederalFundsNeeded": ("federal_fund_estimates", "total_federal_fund_estimates"),
}

# What pre-population leaves in a row of each section when nothing was entered
PRE_POPULATED_ONLY = {
    "budget_categories": {"total_direct_charge_amount": "0.00", "total_amount": "0.00"},
    "non_federal_resources": {"total_amount": "0.00"},
    "federal_fund_estimates": {},
}


@pytest.mark.parametrize("section,fields", SECTIONS_B_C_E.items())
@pytest.mark.parametrize("left_empty_as", ["missing", "pre_populated"])
def test_section_left_empty_matches_legacy(xsd_validator, section, fields, left_empty_as):
    """Legacy writes a section the user left empty as one empty line item per activity,
    titled from Section A, with none of the auto-calculated "0.00" values and no totals."""
    item_field, total_field = fields
    application = _application(2)
    for row in application["activity_line_items"]:
        if left_empty_as == "missing":
            del row[item_field]
        else:
            row[item_field] = dict(PRE_POPULATED_ONLY[item_field])
    # Pre-population fills the totals with zeros even when nothing was entered
    application[total_field] = {key: "0.00" for key in application[total_field]}

    xml_data = _generate(application)
    root = _root(xml_data)
    line_item = LINE_ITEM_SECTIONS[section][0]

    assert _local_names(root.find(f"SF424A:{section}", NS)) == [line_item, line_item]
    assert _titles(root, section) == ["Activity 1", "Activity 2"]
    for element in root.findall(f"SF424A:{section}/SF424A:{line_item}", NS):
        assert len(element) == 0
    # Written with an opening and closing tag, not self-closing, same as legacy
    assert (
        f'<SF424A:{line_item} SF424A:activityTitle="Activity 1"></SF424A:{line_item}>' in xml_data
    )
    _assert_xsd_valid(xsd_validator, xml_data)


@pytest.mark.parametrize("section,fields", SECTIONS_B_C_E.items())
def test_section_used_on_one_row_keeps_totals(xsd_validator, section, fields):
    """Once something is entered in the section, its totals are real and are written,
    and the other row is still listed as an empty line item."""
    item_field, total_field = fields
    application = _application(2)
    application["activity_line_items"][1][item_field] = dict(PRE_POPULATED_ONLY[item_field])

    xml_data = _generate(application)
    root = _root(xml_data)
    line_item, totals = LINE_ITEM_SECTIONS[section]

    assert _local_names(root.find(f"SF424A:{section}", NS)) == [line_item, line_item, totals]
    second = root.findall(f"SF424A:{section}/SF424A:{line_item}", NS)[1]
    assert second.get(ACTIVITY_TITLE_ATTR) == "Activity 2"
    assert len(second) == 0
    _assert_xsd_valid(xsd_validator, xml_data)


@pytest.mark.parametrize("section", ["BudgetSummary", "BudgetCategories"])
def test_sections_a_and_b_always_use_activity_title(section):
    """grant_program from Sections C and E never leaks into Sections A and B."""
    root = _root(_generate({"activity_line_items": [_row(1)], "confirmation": True}))

    assert _titles(root, section) == ["Activity 1"]


###################################
# Conditional activity_title on rows 2-4
###################################


@pytest.mark.parametrize("item_field", ["budget_summary", "budget_categories"])
def test_row_with_data_but_no_activity_title(xsd_validator, item_field):
    """Rows 2-4 with Section A or B data need a title, since every line item needs an
    activityTitle in the XSD. The JSON schema blocks the row, and the XML leaves out a
    line item that has no title rather than writing an invalid one."""
    second_row = {item_field: _row(2)[item_field]}
    application = {"activity_line_items": [_row(1), second_row], "confirmation": True}

    assert _json_issues(application) == [("$.activity_line_items[1].activity_title", "required")]
    xml_data = _generate(application)
    for section in LINE_ITEM_SECTIONS:
        assert _titles(_root(xml_data), section) == _expected_titles(section, 1)
    _assert_xsd_valid(xsd_validator, xml_data)

    second_row["activity_title"] = "Activity 2"
    assert _json_issues(application) == []
    _assert_xsd_valid(xsd_validator, _generate(application))


###################################
# Section D - forecasted cash needs (pivot_object)
###################################


def test_forecasted_cash_needs_pivoted_into_quarters(xsd_validator):
    application = _application(1)
    xml_data = _generate(application)
    forecast = _root(xml_data).find("SF424A:BudgetForecastedCashNeeds", NS)

    assert _local_names(forecast) == list(QUARTER_ELEMENTS)
    for quarter_element, json_column in QUARTER_ELEMENTS.items():
        quarter = forecast.find(f"SF424A:{quarter_element}", NS)
        assert _local_names(quarter) == list(FORECAST_ROWS)
        for amount_element, json_row in FORECAST_ROWS.items():
            expected = application["forecasted_cash_needs"][json_row][json_column]
            assert quarter.findtext(f"SF424A:{amount_element}", namespaces=NS) == expected
    _assert_xsd_valid(xsd_validator, xml_data)


def test_forecasted_cash_needs_partial_data(xsd_validator):
    """Only quarters and rows that have a value are written."""
    application = MINIMAL_APPLICATION | {
        "forecasted_cash_needs": {
            "non_federal_forecasted_cash_needs": {"second_quarter_amount": "25.00"},
        }
    }
    xml_data = _generate(application)
    forecast = _root(xml_data).find("SF424A:BudgetForecastedCashNeeds", NS)

    assert _local_names(forecast) == ["BudgetSecondQuarterAmounts"]
    quarter = forecast.find("SF424A:BudgetSecondQuarterAmounts", NS)
    assert _local_names(quarter) == ["BudgetNonFederalForecastedAmount"]
    assert quarter.findtext("SF424A:BudgetNonFederalForecastedAmount", namespaces=NS) == "25.00"
    _assert_xsd_valid(xsd_validator, xml_data)


@pytest.mark.parametrize(
    "forecasted_cash_needs",
    [
        {},
        {"federal_forecasted_cash_needs": {}},
        # What pre-population leaves when no quarter amount was entered
        {
            "federal_forecasted_cash_needs": {"total_amount": "0.00"},
            "non_federal_forecasted_cash_needs": {"total_amount": "0.00"},
            "total_forecasted_cash_needs": {
                "first_quarter_amount": "0.00",
                "second_quarter_amount": "0.00",
                "third_quarter_amount": "0.00",
                "fourth_quarter_amount": "0.00",
                "total_amount": "0.00",
            },
        },
    ],
)
def test_forecasted_cash_needs_omitted_when_empty(xsd_validator, forecasted_cash_needs):
    """Legacy leaves Section D out when no quarter amount was entered."""
    xml_data = _generate(MINIMAL_APPLICATION | {"forecasted_cash_needs": forecasted_cash_needs})

    assert _root(xml_data).find("SF424A:BudgetForecastedCashNeeds", NS) is None
    _assert_xsd_valid(xsd_validator, xml_data)


###################################
# Section F - other information (compose_object)
###################################


def test_other_information_composed_from_explanation_fields(xsd_validator):
    application = _application(1)
    xml_data = _generate(application)
    other = _root(xml_data).find("SF424A:OtherInformation", NS)

    assert _local_names(other) == [
        "OtherDirectChargesExplanation",
        "OtherIndirectChargesExplanation",
        "Remarks",
    ]
    assert other.findtext("SF424A:OtherDirectChargesExplanation", namespaces=NS) == (
        application["direct_charges_explanation"]
    )
    assert other.findtext("SF424A:OtherIndirectChargesExplanation", namespaces=NS) == (
        application["indirect_charges_explanation"]
    )
    assert other.findtext("SF424A:Remarks", namespaces=NS) == application["remarks"]
    _assert_xsd_valid(xsd_validator, xml_data)


@pytest.mark.parametrize(
    "json_field,xml_element",
    [
        ("direct_charges_explanation", "OtherDirectChargesExplanation"),
        ("indirect_charges_explanation", "OtherIndirectChargesExplanation"),
        ("remarks", "Remarks"),
    ],
)
def test_other_information_with_one_field(xsd_validator, json_field, xml_element):
    xml_data = _generate(MINIMAL_APPLICATION | {json_field: "Only this one"})
    other = _root(xml_data).find("SF424A:OtherInformation", NS)

    assert _local_names(other) == [xml_element]
    assert other.findtext(f"SF424A:{xml_element}", namespaces=NS) == "Only this one"
    _assert_xsd_valid(xsd_validator, xml_data)


def test_other_information_omitted_when_no_explanations():
    assert _root(_generate(MINIMAL_APPLICATION)).find("SF424A:OtherInformation", NS) is None


###################################
# Element order
###################################


def test_root_element_order_matches_xsd():
    """FederalFundsNeeded has its own rule so it can come after Section D; check it does."""
    root = _root(_generate(_application(4)))
    xsd_order = _xsd_sequence("xsd:complexType[@name='BudgetInformationType']")

    assert _local_names(root) == xsd_order


def test_line_item_element_order_matches_xsd_groups():
    """Inside each line item and totals element, children follow the XSD group order."""
    root = _root(_generate(_application(4)))
    groups = {
        "BudgetSummary": "BudgetAmountGroup",
        "BudgetCategories": "BudgetCategoryAmountGroup",
        "NonFederalResources": "ResourceAmountGroup",
        "FederalFundsNeeded": "BudgetFundsAmountGroup",
    }

    summary_line_item_order = _xsd_sequence("xsd:element[@name='SummaryLineItem']/xsd:complexType")

    for section, group in groups.items():
        xsd_order = _xsd_sequence(f"xsd:group[@name='{group}']")
        for element in root.find(f"SF424A:{section}", NS):
            emitted = _local_names(element)
            if lxml_etree.QName(element).localname == "SummaryLineItem":
                # CFDANumber comes before the BudgetAmountGroup in a SummaryLineItem
                assert summary_line_item_order == ["CFDANumber"]
                assert emitted == ["CFDANumber"] + [n for n in xsd_order if n in emitted]
            else:
                assert emitted == [name for name in xsd_order if name in emitted]


def test_forecast_and_other_information_order_matches_xsd():
    root = _root(_generate(_application(1)))

    assert _local_names(root.find("SF424A:BudgetForecastedCashNeeds", NS)) == _xsd_sequence(
        "xsd:element[@name='BudgetForecastedCashNeeds']/xsd:complexType"
    )
    assert _local_names(root.find("SF424A:OtherInformation", NS)) == _xsd_sequence(
        "xsd:element[@name='OtherInformation']/xsd:complexType"
    )


###################################
# Robustness
###################################


def test_fields_at_max_length_still_validate(xsd_validator):
    """Schema max lengths line up with the XSD types (120 for titles, 50 and 250 for text)."""
    first_row = _row(1, activity_title="T" * 120)
    first_row["non_federal_resources"]["grant_program"] = "C" * 120
    first_row["federal_fund_estimates"]["grant_program"] = "E" * 120
    application = _application(1) | {
        "activity_line_items": [first_row],
        "direct_charges_explanation": "D" * 50,
        "indirect_charges_explanation": "I" * 50,
        "remarks": "R" * 250,
    }
    assert _json_issues(application) == []

    xml_data = _generate(application)
    root = _root(xml_data)

    assert _titles(root, "BudgetSummary") == ["T" * 120]
    assert _titles(root, "NonFederalResources") == ["C" * 120]
    assert _titles(root, "FederalFundsNeeded") == ["E" * 120]
    assert root.findtext("SF424A:OtherInformation/SF424A:Remarks", namespaces=NS) == "R" * 250
    _assert_xsd_valid(xsd_validator, xml_data)


def test_special_characters_are_escaped(xsd_validator):
    """Titles go into attributes and remarks into text, both need escaping."""
    title = 'R&D <Phase 1> "Pilot"'
    remarks = "Costs < 5% & rising > plan"
    application = MINIMAL_APPLICATION | {
        "activity_line_items": [_row(1, activity_title=title)],
        "remarks": remarks,
    }
    xml_data = _generate(application)
    root = _root(xml_data)

    assert _titles(root, "BudgetSummary") == [title]
    assert root.findtext("SF424A:OtherInformation/SF424A:Remarks", namespaces=NS) == remarks
    _assert_xsd_valid(xsd_validator, xml_data)


def test_zeros_entered_by_the_user_are_written(xsd_validator):
    """A "0" the user typed is data, unlike the auto-calculated zeros, so it's written."""
    application = {
        "activity_line_items": [
            {
                "activity_title": "Activity 1",
                "budget_categories": {
                    "personnel_amount": "0",
                    "total_direct_charge_amount": "0.00",
                    "total_amount": "0.00",
                },
            }
        ],
        "confirmation": True,
    }
    xml_data = _generate(application)
    category_set = _root(xml_data).find("SF424A:BudgetCategories/SF424A:CategorySet", NS)

    assert _local_names(category_set) == [
        "BudgetPersonnelRequestedAmount",
        "BudgetTotalDirectChargesAmount",
        "BudgetTotalAmount",
    ]
    assert category_set.findtext("SF424A:BudgetPersonnelRequestedAmount", namespaces=NS) == "0.00"
    assert category_set.findtext("SF424A:BudgetTotalAmount", namespaces=NS) == "0.00"
    _assert_xsd_valid(xsd_validator, xml_data)


def _drop_cents(data: Any) -> Any:
    """Turns every "123.00" amount into "123", the way a user can type it."""
    if isinstance(data, dict):
        return {key: _drop_cents(value) for key, value in data.items()}
    if isinstance(data, list):
        return [_drop_cents(value) for value in data]
    if isinstance(data, str) and data.endswith(".00"):
        return data.removesuffix(".00")
    return data


def test_whole_dollar_amounts_written_with_two_decimals(xsd_validator):
    """An amount typed as "11" goes out as "11.00", in every section, line items, totals
    and Section D alike."""
    expected_xml = _generate(_application(4))
    application = _drop_cents(_application(4))
    assert application["activity_line_items"][0]["budget_summary"]["total_amount"] == "105"
    assert _json_issues(application) == []

    xml_data = _generate(application)

    assert xml_data == expected_xml
    _assert_xsd_valid(xsd_validator, xml_data)


@pytest.mark.parametrize(
    "amount,expected",
    [("11", "11.00"), ("11.50", "11.50"), (".50", "0.50"), ("0", "0.00"), ("-11", "-11.00")],
)
def test_amount_formats(amount, expected):
    application = {
        "activity_line_items": [
            {"activity_title": "Activity 1", "budget_summary": {"total_amount": amount}}
        ],
        "forecasted_cash_needs": {
            "federal_forecasted_cash_needs": {"first_quarter_amount": amount}
        },
        "confirmation": True,
    }
    root = _root(_generate(application))

    assert (
        root.findtext(
            ".//SF424A:SummaryLineItem/SF424A:BudgetTotalNewOrRevisedAmount", namespaces=NS
        )
        == expected
    )
    assert (
        root.findtext(
            ".//SF424A:BudgetFirstQuarterAmounts/SF424A:BudgetFederalForecastedAmount",
            namespaces=NS,
        )
        == expected
    )
