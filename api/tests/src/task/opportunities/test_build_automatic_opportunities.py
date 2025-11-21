import pytest
from sqlalchemy import update

from src.db.models.competition_models import Form
from src.task.opportunities.build_automatic_opportunities import BuildAutomaticOpportunitiesTask
from tests.src.db.models.factories import FormFactory


@pytest.fixture(autouse=True)
def cleanup_forms(db_session):
    # To avoid picking up a bunch of forms from other tests
    # set every existing form to be deprecated
    # so that the logic here doesn't see them
    # This is simpler than trying to delete all the forms.
    db_session.execute(update(Form).values(is_deprecated=True))
    db_session.commit()


def test_build_automatic_opportunities(enable_factory_create, db_session):
    forms = FormFactory.create_batch(size=3)

    task = BuildAutomaticOpportunitiesTask(db_session)
    task.run()

    # Grab the opportunities created from the task itself
    opportunities = task.opportunities
    assert len(opportunities) == 4

    # Figure out the forms we added to each opportunity
    opp_form_ids_for_opps = set()
    for opportunity in opportunities:
        opp_form_ids = frozenset(c.form_id for c in opportunity.competitions[0].competition_forms)
        opp_form_ids_for_opps.add(opp_form_ids)

    # Each form should have gotten its own opportunity
    all_form_ids = set()
    for form in forms:
        assert {form.form_id} in opp_form_ids_for_opps
        all_form_ids.add(form.form_id)

    # There should also be one opportunity with every form
    assert all_form_ids in opp_form_ids_for_opps

    assert task.metrics[task.Metrics.OPPORTUNITY_CREATED_COUNT] == 4
    assert task.metrics[task.Metrics.OPPORTUNITY_ALREADY_EXIST_COUNT] == 0

    # If we rerun the task, only the all-form opportunity will be created
    task = BuildAutomaticOpportunitiesTask(db_session)
    task.run()

    assert len(task.opportunities) == 1
    assert all_form_ids == {
        c.form_id for c in task.opportunities[0].competitions[0].competition_forms
    }

    assert task.metrics[task.Metrics.OPPORTUNITY_CREATED_COUNT] == 1
    assert task.metrics[task.Metrics.OPPORTUNITY_ALREADY_EXIST_COUNT] == 3


def test_does_not_work_in_prod(db_session, monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "prod")
    with pytest.raises(Exception, match="This task is not meant to be run in production"):
        BuildAutomaticOpportunitiesTask(db_session).run()
