from copy import deepcopy

import pytest
from sqlalchemy import update

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
from src.task.opportunities.build_automatic_opportunities import BuildAutomaticOpportunitiesTask

# These are forms that we use in the build logic
# that we need to make sure exist for the purposes of testing
FORMS_USED = [
    ProjectAbstractSummary_v2_0,
    BudgetNarrativeAttachment_v1_2,
    SF424_v4_0,
    SF424a_v1_0,
    ProjectNarrativeAttachment_v1_2,
    SF424b_v1_1,
    SFLLL_v2_0,
]


@pytest.fixture
def forms(db_session):
    # To avoid picking up a bunch of forms from other tests
    # set every existing form to be deprecated
    # so that the logic here doesn't see them
    # This is simpler than trying to delete all the forms.
    db_session.execute(update(Form).values(is_deprecated=True))
    db_session.commit()

    # However, we do need some forms setup for these tests
    # Add any forms we reference here. We don't just add ALL
    # forms to avoid this test iterating over 20+ forms in the future.
    forms = []
    for form in FORMS_USED:
        # deep copy to not change the global form definition
        # when we null-out the instruction ID to avoid setting up
        # things we won't need in this test
        f = deepcopy(form)
        f.form_instruction_id = None
        db_session.merge(f)
        forms.append(f)
    db_session.commit()

    return forms


def test_build_automatic_opportunities(enable_factory_create, db_session, forms):
    task = BuildAutomaticOpportunitiesTask(db_session)
    task.run()

    # Grab the opportunities created from the task itself
    opportunities = task.opportunities
    
    # Separate opportunities by the number of forms they contain
    single_form_opps = []
    all_forms_opp = None
    scenario_opps = []
    
    all_form_ids_set = {form.form_id for form in forms}
    
    for opp in opportunities:
        opp_form_ids = frozenset(
            form_id for comp in opp.competitions for form_id in [c.form_id for c in comp.competition_forms]
        )
        
        if opp_form_ids == all_form_ids_set:
            all_forms_opp = opp
        elif len(opp_form_ids) == 1:
            single_form_opps.append(opp)
        else:
            scenario_opps.append(opp)
    
    # Validate the breakdown
    assert len(single_form_opps) == len(forms)
    assert all_forms_opp is not None
    expected_opportunities = len(single_form_opps) + 1 + len(scenario_opps)
    assert len(opportunities) == expected_opportunities

    # Each form should have gotten its own opportunity
    all_form_ids = {form.form_id for form in forms}
    single_form_ids_in_opps = {
        next(iter(opp_form_ids)) for opp in single_form_opps 
        for opp_form_ids in [{c.form_id for comp in opp.competitions for c in comp.competition_forms}]
    }
    assert single_form_ids_in_opps == all_form_ids

    assert task.metrics[task.Metrics.OPPORTUNITY_CREATED_COUNT] == expected_opportunities
    assert task.metrics[task.Metrics.OPPORTUNITY_ALREADY_EXIST_COUNT] == 0

    # If we rerun the task, only the all-form opportunity will be created
    task = BuildAutomaticOpportunitiesTask(db_session)
    task.run()

    assert len(task.opportunities) == 1
    assert all_form_ids == {
        c.form_id for c in task.opportunities[0].competitions[0].competition_forms
    }

    assert task.metrics[task.Metrics.OPPORTUNITY_CREATED_COUNT] == 1
    assert task.metrics[task.Metrics.OPPORTUNITY_ALREADY_EXIST_COUNT] == expected_opportunities - 1


def test_does_not_work_in_prod(db_session, monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "prod")
    with pytest.raises(Exception, match="This task is not meant to be run in production"):
        BuildAutomaticOpportunitiesTask(db_session).run()
