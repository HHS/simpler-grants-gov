from sqlalchemy import text

from src.constants.lookup_constants import OpportunityStatus
from src.db.models.opportunity_models import OpportunityVersion
from tests.src.db.models.factories import OpportunityVersionFactory


class TestOpportunityVersion:
    def test_status_filter_uses_expression_index(self, enable_factory_create, db_session):
        """Filtering on opportunity_data ->> 'opportunity_status' can use the expression index"""
        OpportunityVersionFactory.create_batch(3)

        query = db_session.query(OpportunityVersion.opportunity_version_id).filter(
            OpportunityVersion.opportunity_data["opportunity_status"].astext.in_(
                [OpportunityStatus.FORECASTED, OpportunityStatus.POSTED]
            )
        )
        bind = db_session.get_bind()
        compiled = query.statement.compile(
            dialect=bind.dialect,
            schema_translate_map=bind.get_execution_options()["schema_translate_map"],
            render_schema_translate=True,
            compile_kwargs={"literal_binds": True},
        )

        with db_session.begin():
            db_session.execute(text("SET LOCAL enable_seqscan = off"))
            plan = "\n".join(
                row[0] for row in db_session.execute(text(f"EXPLAIN {compiled}")).all()
            )

        assert "opportunity_version_opportunity_status_idx" in plan
