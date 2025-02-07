from . import task_blueprint
import src.adapters.db.flask_db as flask_db
import src.adapters.db as db
from src.db.models.opportunity_models import Parent, Child, CurrentChild, ParentHistory, ChildHistory, CurrentChildHistory, ParentBaseMixin, CurrentChildBaseMixin, ChildBaseMixin
from sqlalchemy import Select, union, asc, desc

from ..constants.lookup_constants import OpportunityStatus
import random
import time

id = random.randint(5, 10000000)


@task_blueprint.cli.command("test-stuff")
@flask_db.with_db_session()
def do_stuff(db_session: db.Session) -> None:
    print("=======")
    print(id)
    print("=======")

    with db_session.begin():
        parent = Parent(parent_id=id, opportunity_number="abc-123", opportunity_title="original")
        db_session.add(parent)

        child = Child(parent=parent, is_forecast=True, description="hello")
        db_session.add(child)

        current_child = CurrentChild(parent=parent, child=child, opportunity_status=OpportunityStatus.POSTED)
        db_session.add(current_child)

    time.sleep(1)
    # Iteration 2
    with db_session.begin():
        db_session.expunge_all()
        db_session.expire_all()

        parent = db_session.execute(Select(Parent).where(Parent.parent_id == id)).scalar_one_or_none()

        parent.opportunity_title = "something else"

        child = db_session.execute(Select(Child).where(Child.parent_id == id)).scalar_one_or_none()

        child.description = "updated"

        parent.current_child.opportunity_status = OpportunityStatus.CLOSED


    time.sleep(1)
    # Iteration 3
    with db_session.begin():
        db_session.expunge_all()
        db_session.expire_all()

        parent = db_session.execute(Select(Parent).where(Parent.parent_id == id)).scalar_one_or_none()

        parent.opportunity_title = "3rd time"


    time.sleep(1)
    # Iteration 4
    with db_session.begin():
        db_session.expunge_all()
        db_session.expire_all()

        parent = db_session.execute(Select(Parent).where(Parent.parent_id == id)).scalar_one_or_none()

        child = db_session.execute(Select(Child).where(Child.parent_id == id)).scalar_one_or_none()

        child.description = "update from iteration 4"

        parent.current_child.opportunity_status = OpportunityStatus.ARCHIVED


    # Versioning joins testing
    with db_session.begin():
        db_session.expunge_all()
        db_session.expire_all()

        # what if we did a select with everything in it for a given specific timestamp?


        #historical_parents = list(db_session.execute(Select(ParentHistory).where(ParentHistory.parent_id == id).order_by(asc(ParentHistory.end))).scalars())
        #parent = db_session.execute(Select(Parent).where(ParentHistory.parent_id == id)).scalar_one_or_none()

        #historical_current_children = db_session.execute(Select(CurrentChildHistory).where(CurrentChildHistory.parent_id == id).order_by(asc(CurrentChildHistory.end))).scalars()
        #current_child = db_session.execute(Select(CurrentChild).where(CurrentChild.parent_id == id)).scalar_one_or_none()

        # TODO - am I sure there is no way to do this with a relationship?
        #        We would need to make the current record be in the historical data (doable)
        #        We would need a relationship on the model that we can actually use?





# TODO list
# Relationship on history tables - setup an example join?
# Timestamps are slightly off with start/end due to updated_at being ORM-set
# - Might have a fix assuming nothing else breaks by just making everything sqlnow() instead of using python datetime (which won't be consistent in a transaction)
# One-to-many table behavior
# Figure out a way to tell the new_version logic to ignore a model (for transformation process) - some non-db value? Add a flag like "imported by legacy"?
# The relationships (of non-historical tables) need to be verified they get caught/trigger a historical event



"""
{
  "versions": [
   {
     "timestamp": "2025-01-01T00:00:00Z",
     "changes": [
        {
           "field": "opportunity_title",
           "from": "abc123",
           "to": "xyz789",
        },
        {
           "field": "summary.opportunity_description",
           "from": "abc123",
           "to": "xyz789",
        }
     ]
   }
  ]
}



{
    "fields": {
        "opportunity_title": {
            "changes": [
                {
                    "timestamp": "2025-01-01T00:00:00Z",
                    "from": "abc123",
                    "to": "xyz789",
                }
            ]
        }
    }
}



"""
