import copy

import pytest

from src.db.models.competition_models import Form
from src.form_schema.forms import (
    BudgetNarrativeAttachment_v1_2,
    ProjectAbstractSummary_v2_0,
    ProjectNarrativeAttachment_v1_2,
    SF424_v4_0,
    SF424a_v1_0,
    SF424b_v1_1,
    SFLLL_v2_0,
)
from src.form_schema.jsonschema_resolver import resolve_jsonschema
from src.form_schema.jsonschema_validator import validate_json_schema_for_form


def setup_resolved_form(form: Form):
    """Setup a fully resolved form"""
    # do a copy so we aren't modifying a global form object
    copied_form = copy.deepcopy(form)
    copied_form.form_json_schema = resolve_jsonschema(form.form_json_schema)

    return copied_form


def validate_required(data: dict, expected_required_fields: list[str], form: Form):
    validation_issues = validate_json_schema_for_form(data, form)

    assert len(validation_issues) == len(expected_required_fields)
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        assert validation_issue.field in expected_required_fields


@pytest.fixture(scope="session")
def sf424_v4_0():
    return setup_resolved_form(SF424_v4_0)


@pytest.fixture(scope="session")
def sf424a_v1_0():
    return setup_resolved_form(SF424a_v1_0)


@pytest.fixture(scope="session")
def sf424b_v1_1():
    return setup_resolved_form(SF424b_v1_1)


@pytest.fixture(scope="session")
def sflll_v2_0():
    return setup_resolved_form(SFLLL_v2_0)


@pytest.fixture(scope="session")
def project_abstract_summary_v2_0():
    return setup_resolved_form(ProjectAbstractSummary_v2_0)


@pytest.fixture(scope="session")
def project_narrative_attachment_v1_2():
    return setup_resolved_form(ProjectNarrativeAttachment_v1_2)


@pytest.fixture(scope="session")
def budget_narrative_attachment_v1_2():
    return setup_resolved_form(BudgetNarrativeAttachment_v1_2)
