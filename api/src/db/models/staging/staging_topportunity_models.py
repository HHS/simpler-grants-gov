from datetime import date, datetime

from sqlalchemy import VARCHAR, Integer
from sqlalchemy.orm import Mapped, mapped_column

from src.constants.lookup_constants import OpportunityCategory
from src.db.models.base import Base, TimestampMixin
from src.db.models.opportunity_models import Opportunity


class StagingTopportunity(Base, TimestampMixin):
    __tablename__ = "staging_topportunity"

    opportunity_id: Mapped[int] = mapped_column(Integer, primary_key=True)

    oppnumber: Mapped[str | None] = mapped_column(VARCHAR(length=160))
    opptitle: Mapped[str | None] = mapped_column(VARCHAR(length=1020), index=True)

    owningagency: Mapped[str | None] = mapped_column(VARCHAR(length=1020))

    oppcategory: Mapped[str | None] = mapped_column(VARCHAR(length=4), index=True)
    category_explanation: Mapped[str | None] = mapped_column(VARCHAR(length=1020))

    is_draft: Mapped[str] = mapped_column(VARCHAR(length=4), index=True)

    revision_number: Mapped[int | None]
    modified_comments: Mapped[str | None] = mapped_column(VARCHAR(length=4000))

    publisheruid: Mapped[str | None] = mapped_column(VARCHAR(length=1020))
    publisher_profile_id: Mapped[int | None]

    last_upd_id: Mapped[str | None] = mapped_column(VARCHAR(length=200))
    last_upd_date: Mapped[date | None]
    creator_id: Mapped[str | None] = mapped_column(VARCHAR(length=200))
    created_date: Mapped[date | None]

    def get_as_opportunity(self) -> Opportunity:
        # Using this table directly from our opportunity endpoint is temporary
        # until we implement the data transformation layer, this converts
        # to what our API currently expects without requiring us to rewrite the Marshmallow/API layer

        is_draft = None
        if self.is_draft == "Y":
            is_draft = True
        elif self.is_draft == "N":
            is_draft = False

        opportunity_category = None
        if self.oppcategory:
            opportunity_category = OpportunityCategory(self.oppcategory)

        # convert the update/create dates to datetime at 00:00:00
        created_at, updated_at = None, None
        if self.created_date:
            created_at = datetime.combine(self.created_date, datetime.min.time())
        if self.last_upd_date:
            updated_at = datetime.combine(self.last_upd_date, datetime.min.time())

        return Opportunity(
            opportunity_id=self.opportunity_id,
            opportunity_number=self.oppnumber,
            opportunity_title=self.opptitle,
            agency=self.owningagency,
            category=opportunity_category,
            category_explanation=self.category_explanation,
            is_draft=is_draft,
            revision_number=self.revision_number,
            modified_comments=self.modified_comments,
            publisher_user_id=self.publisheruid,
            publisher_profile_id=self.publisher_profile_id,
            created_at=created_at,
            updated_at=updated_at,
        )
