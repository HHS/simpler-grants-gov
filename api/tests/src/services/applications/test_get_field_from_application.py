from decimal import Decimal

from src.adapters import db
from src.db.models.competition_models import Application, ApplicationForm, Form
from src.form_schema.forms import (
    ProjectAbstractSummary_v2_0,
    SF424_v4_0,
    SF424a_v1_0,
    SF424b_v1_1,
    SF424d_v1_1,
)
from src.services.applications.get_field_from_application import (
    get_project_title_from_application,
    get_requested_amount_from_application,
)
from tests.src.db.models.factories import (
    ApplicationFactory,
    ApplicationFormFactory,
    CompetitionFormFactory,
)


def add_form_to_application(
    db_session: db.Session,
    application: Application,
    form: Form,
    application_response: dict,
    is_required_form: bool = True,
    is_included_in_submission: bool = True,
) -> ApplicationForm:
    # We do this so the form is attached to the session
    # and uses whatever is already in the DB
    attached_form = db_session.merge(form, load=True)
    competition_form = CompetitionFormFactory.create(
        competition=application.competition, form=attached_form, is_required=is_required_form
    )
    application_form = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response=application_response,
        is_included_in_submission=is_included_in_submission,
    )
    return application_form


def test_get_project_title_from_application_sf424(
    db_session, enable_factory_create, load_active_forms
):
    application = ApplicationFactory.create()
    add_form_to_application(
        db_session, application, SF424_v4_0, {"project_title": "my fun project"}
    )
    assert get_project_title_from_application(application) == "my fun project"


def test_get_project_title_from_project_abstract_summary(
    db_session, enable_factory_create, load_active_forms
):
    application = ApplicationFactory.create()
    add_form_to_application(
        db_session,
        application,
        ProjectAbstractSummary_v2_0,
        {"project_title": "another fun project"},
    )
    assert get_project_title_from_application(application) == "another fun project"


def test_get_project_title_no_form_with_value_present(
    db_session, enable_factory_create, load_active_forms
):
    application = ApplicationFactory.create()
    # Add a few forms with various fields
    add_form_to_application(db_session, application, SF424a_v1_0, {"activity_line_items": []})
    add_form_to_application(db_session, application, SF424b_v1_1, {"title": "a different title"})
    add_form_to_application(db_session, application, SF424d_v1_1, {"title": "yet another title"})
    # Add the two forms that can have this, but don't set it
    add_form_to_application(db_session, application, SF424_v4_0, {"sam_uei": "123456789012"})
    add_form_to_application(
        db_session, application, ProjectAbstractSummary_v2_0, {"applicant_name": "Bob"}
    )
    assert get_project_title_from_application(application) is None


def test_get_project_title_both_forms_present(db_session, enable_factory_create, load_active_forms):
    application = ApplicationFactory.create()
    # Both forms are present, so the first one in the list is used
    add_form_to_application(
        db_session, application, SF424_v4_0, {"project_title": "my fun project"}
    )
    add_form_to_application(
        db_session,
        application,
        ProjectAbstractSummary_v2_0,
        {"project_title": "another fun project"},
    )
    assert get_project_title_from_application(application) == "my fun project"


def test_get_project_title_both_forms_present_null_on_first(
    db_session, enable_factory_create, load_active_forms
):
    application = ApplicationFactory.create()
    # Both forms are present, so the first one in the list is used
    add_form_to_application(db_session, application, SF424_v4_0, {"project_title": None})
    add_form_to_application(
        db_session,
        application,
        ProjectAbstractSummary_v2_0,
        {"project_title": "another fun project"},
    )
    assert get_project_title_from_application(application) == "another fun project"


def test_get_project_title_from_application_bad_title(
    db_session, enable_factory_create, load_active_forms
):
    application = ApplicationFactory.create()
    add_form_to_application(db_session, application, SF424_v4_0, {"project_title": 123})
    assert get_project_title_from_application(application) is None


def test_get_requested_amount_sf424(db_session, enable_factory_create, load_active_forms):
    application = ApplicationFactory.create()
    add_form_to_application(
        db_session, application, SF424_v4_0, {"federal_estimated_funding": "100.12"}
    )
    assert get_requested_amount_from_application(application) == Decimal("100.12")


def test_get_requested_amount_sf424a(db_session, enable_factory_create, load_active_forms):
    application = ApplicationFactory.create()
    add_form_to_application(
        db_session,
        application,
        SF424a_v1_0,
        {"total_budget_summary": {"federal_new_or_revised_amount": "55.23"}},
    )
    assert get_requested_amount_from_application(application) == Decimal("55.23")


def test_get_requested_amount_both_forms_present(
    db_session, enable_factory_create, load_active_forms
):
    application = ApplicationFactory.create()
    # Both forms are present, so the first one in the list is used
    add_form_to_application(
        db_session, application, SF424_v4_0, {"federal_estimated_funding": "35.45"}
    )
    add_form_to_application(
        db_session,
        application,
        SF424a_v1_0,
        {"total_budget_summary": {"federal_new_or_revised_amount": "77.54"}},
    )
    assert get_requested_amount_from_application(application) == Decimal("35.45")


def test_get_requested_amount_both_forms_present_null_on_first(
    db_session, enable_factory_create, load_active_forms
):
    application = ApplicationFactory.create()
    add_form_to_application(
        db_session, application, SF424_v4_0, {"non_federal_estimated_funding": "123.45"}
    )
    add_form_to_application(
        db_session,
        application,
        SF424a_v1_0,
        {"total_budget_summary": {"federal_new_or_revised_amount": "55.55"}},
    )
    assert get_requested_amount_from_application(application) == Decimal("55.55")


def test_get_requested_amount_no_form_with_value_present(
    db_session, enable_factory_create, load_active_forms
):
    application = ApplicationFactory.create()
    # Add a few forms with various fields
    add_form_to_application(db_session, application, SF424b_v1_1, {"title": "a different title"})
    add_form_to_application(db_session, application, SF424d_v1_1, {"title": "yet another title"})
    add_form_to_application(
        db_session, application, ProjectAbstractSummary_v2_0, {"applicant_name": "Bob"}
    )
    # Add the two forms that can have this, but don't set it
    add_form_to_application(
        db_session,
        application,
        SF424a_v1_0,
        {"total_budget_summary": {"non_federal_new_or_revised_amount": "1.20"}},
    )
    add_form_to_application(db_session, application, SF424_v4_0, {"sam_uei": "123456789012"})
    assert get_requested_amount_from_application(application) is None


def test_get_requested_amount_bad_monetary_amount(
    db_session, enable_factory_create, load_active_forms
):
    application = ApplicationFactory.create()
    add_form_to_application(
        db_session,
        application,
        SF424a_v1_0,
        {"total_budget_summary": {"federal_new_or_revised_amount": "hello"}},
    )
    assert get_requested_amount_from_application(application) is None


def test_get_project_title_in_non_included_form(
    db_session, enable_factory_create, load_active_forms
):
    application = ApplicationFactory.create()
    # The first form won't be used because it's not included in the submission and isn't required
    add_form_to_application(
        db_session,
        application,
        SF424_v4_0,
        {"project_title": "the first one"},
        is_required_form=False,
        is_included_in_submission=False,
    )
    add_form_to_application(
        db_session, application, ProjectAbstractSummary_v2_0, {"project_title": "the second one"}
    )
    assert get_project_title_from_application(application) == "the second one"
