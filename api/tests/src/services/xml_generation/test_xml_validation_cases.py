"""XSD validation coverage for the shared XML-generation test cases.

Ported from the ``test-xml-validation`` CLI runner (#10426) so the sample
cases in ``src/services/xml_generation/validation/test_cases.py`` are validated
against their XSD schemas in CI on every commit. Each case is generated through
``XMLGenerationService`` and validated with ``XSDValidator``, mirroring
``ValidationTestRunner``.

The CLI runner and ``test_cases.py`` are left untouched here; #10427 retires them.
"""

from pathlib import Path

import pytest

from src.form_schema.forms import init_form_registry
from src.services.xml_generation.config import _build_xml_form_map
from src.services.xml_generation.validation.test_cases import get_all_test_cases
from src.services.xml_generation.validation.test_runner import ValidationTestRunner

XSD_DIR = Path(__file__).parents[4] / "src/services/xml_generation/xsds"


def _test_case_params() -> list:
    """Build parametrized cases for every shared XML-generation sample case."""
    return [pytest.param(test_case, id=test_case["name"]) for test_case in get_all_test_cases()]


@pytest.fixture(scope="module")
def validation_runner() -> ValidationTestRunner:
    """Runner wired to the local XSD directory and the form transform map."""
    init_form_registry()
    return ValidationTestRunner(xsd_dir=XSD_DIR, xml_form_map=_build_xml_form_map())


@pytest.mark.parametrize("test_case", _test_case_params())
def test_xml_validates_against_xsd(
    validation_runner: ValidationTestRunner, test_case: dict
) -> None:
    """Generated XML for each sample case validates against its XSD schema."""
    result = validation_runner.run_validation_test(
        test_name=test_case["name"],
        json_input=test_case["json_input"],
        xsd_url_or_path=test_case["xsd_url"],
        form_name=test_case.get("short_form_name", test_case.get("form_name", "SF424_4_0")),
        pretty_print=test_case.get("pretty_print", True),
        attachment_mapping=test_case.get("attachment_mapping"),
    )

    assert result["success"], result["error_message"]
