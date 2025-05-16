import uuid

from sqlalchemy import ColumnExpressionArgument, select
from sqlalchemy.orm import noload, selectinload

import src.adapters.db as db
from src.adapters.aws import S3Config
from src.api.route_utils import raise_flask_error
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import Opportunity, OpportunityAttachment
from src.util.env_config import PydanticBaseEnvConfig
from src.util.file_util import convert_public_s3_to_cdn_url, pre_sign_file_location


class AttachmentConfig(PydanticBaseEnvConfig):
    # If the CDN URL is set, we'll use it instead of pre-signing the file locations
    cdn_url: str | None = None


def _fetch_opportunity(
    db_session: db.Session,
    where_clause: ColumnExpressionArgument[bool],
    load_all_opportunity_summaries: bool,
) -> Opportunity:
    stmt = (
        select(Opportunity)
        .where(where_clause)
        .where(Opportunity.is_draft.is_(False))
        .options(selectinload("*"))
        # To get the top_level_agency field set properly upfront,
        # we need to explicitly join here as the "*" approach doesn't
        # seem to work with the way our agency relationships are setup
        .options(selectinload(Opportunity.agency_record).selectinload(Agency.top_level_agency))
    )

    if not load_all_opportunity_summaries:
        stmt = stmt.options(noload(Opportunity.all_opportunity_summaries))

    opportunity = db_session.execute(stmt).unique().scalar_one_or_none()

    return opportunity


def pre_sign_opportunity_file_location(
    opp_atts: list,
) -> list[OpportunityAttachment]:
    for opp_att in opp_atts:
        opp_att.download_path = pre_sign_file_location(opp_att.file_location)

    return opp_atts


def _setup_attachements(opportunity: Opportunity) -> None:
    attachment_config = AttachmentConfig()
    if attachment_config.cdn_url is not None:
        s3_config = S3Config()
        for opp_att in opportunity.opportunity_attachments:
            opp_att.download_path = convert_public_s3_to_cdn_url(  # type: ignore
                opp_att.file_location, attachment_config.cdn_url, s3_config
            )
    else:
        pre_sign_opportunity_file_location(opportunity.opportunity_attachments)


def get_opportunity(db_session: db.Session, opportunity_id: uuid.UUID) -> Opportunity:
    opportunity = _fetch_opportunity(
        db_session,
        where_clause=Opportunity.opportunity_id == opportunity_id,
        load_all_opportunity_summaries=False,
    )
    if opportunity is None:
        raise_flask_error(404, message=f"Could not find Opportunity with ID {opportunity_id}")

    _setup_attachements(opportunity)

    return opportunity


def get_opportunity_by_legacy_id(db_session: db.Session, legacy_opportunity_id: int) -> Opportunity:
    opportunity = _fetch_opportunity(
        db_session,
        where_clause=Opportunity.legacy_opportunity_id == legacy_opportunity_id,
        load_all_opportunity_summaries=False,
    )
    if opportunity is None:
        raise_flask_error(
            404, message=f"Could not find Opportunity with Legacy ID {legacy_opportunity_id}"
        )

    _setup_attachements(opportunity)

    return opportunity
