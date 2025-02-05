from . import task_blueprint
import src.adapters.db.flask_db as flask_db
import src.adapters.db as db
from src.db.models.opportunity_models import Parent, CurrentChild, Child, ParentAssistanceListing
from sqlalchemy import Select

from ..constants.lookup_constants import OpportunityStatus


@task_blueprint.cli.command("test-stuff")
@flask_db.with_db_session()
def export_opportunity_data(db_session: db.Session) -> None:

    id = 7

    with db_session.begin():
        parent = Parent(opportunity_id=id, title="original title")
        db_session.add(parent)

        child = Child(opportunity_id=id, is_forecast=False, description="hello")
        db_session.add(child)

        current_child = CurrentChild(parent=parent, child=child, opportunity_status=OpportunityStatus.POSTED)
        db_session.add(current_child)

        assistancelisting1 = ParentAssistanceListing(parent=parent, assistance_listing_number=f"{id}.{id}")
        assistancelisting2 = ParentAssistanceListing(parent=parent, assistance_listing_number=f"{id}.{id}{id}")

        db_session.add(assistancelisting1)
        db_session.add(assistancelisting2)


    with db_session.begin():
        db_session.expunge_all()
        db_session.expire_all()

        parent = db_session.execute(Select(Parent).where(Parent.opportunity_id == id, Parent.end.is_(None))).scalar_one_or_none()

        print(parent.all_children)

        parent.title = "something new"

        #child = parent.all_children[0]

        #child.description = "changed description"

        #print(parent.all_children)

        #child = Child(opportunity_id=1, is_forecast=False, description="hello")
        #db_session.add(child)


        #parent.title = "third title"
