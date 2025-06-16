import json
import logging
from datetime import datetime
from typing import Tuple
from uuid import UUID

from numpy.random.mtrand import Sequence
from sqlalchemy import select, update, func, desc, tuple_
from sqlalchemy.orm import selectinload, aliased


from src.adapters import db
from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema
from src.constants.lookup_constants import OpportunityStatus
from src.db.models.opportunity_models import OpportunityChangeAudit, OpportunityVersion
from src.db.models.user_models import UserSavedOpportunity
from src.task.notifications.base_notification import BaseNotificationTask
from src.task.notifications.constants import Metrics, NotificationReason, UserEmailNotification
from src.util import datetime_util
from src.util.dict_util import diff_nested_dicts

logger = logging.getLogger(__name__)

SCHEMA = OpportunityV1Schema()

IMPORTANT_DATE_FIELDS = {
    "close_date": "The application due date changed from",
    "forecasted_award_date": "The estimated award date changed from",
    "forecasted_project_start_date": "The estimated project start date changed from",
    "fiscal_year": "The fiscal year changed from",
}

AWARD_FIELDS = {
    "estimated_total_program_funding": "Program funding changed from",
    "expected_number_of_awards": "The number of expected awards changed from",
    "award_floor": "The award minimum changed from",
    "award_ceiling": "The award maximum changed from",
}

CATEGORIZATION_FIELDS = {
    "is_cost_sharing": "Cost sharing or matching requirement has changed from",
    "funding_instruments": "The funding instrument type has changed from",
    "category": "The opportunity category has changed from",
    "category_explanation": "Opportunity category explanation has changed from",
    "funding_categories": "The category of funding activity has changed from",
    "funding_category_description": "The funding category explanation has been changed from"
}

ELIGIBILITY_FIELDS = {
    "applicant_types": "eligibility criteria include:",
    "applicant_eligibility_description": "Additional information was",
}

GRANTOR_CONTACT_INFORMATION_FIELDS = {
    "agency_name": "The updated grantor’s name is",  # we dont have this
    "agency_email_address": "The updated email address is",
    "agency_contact_description": "New description:",
}

DOCUMENTS_FIELDS = {
    "attachments": "One or more new documents were ",
    "additional_info_url": "A link to additional information was",
}

CONTACT_INFO = (
    "<div>"
    "If you have questions, please contact the Grants.gov Support Center:<br><br>"
    "<a href='mailto:support@grants.gov'>support@grants.gov</a><br>"
    "1-800-518-4726<br>"
    "24 hours a day, 7 days a week<br>"
    "Closed on federal holidays"
    "</div>"
)

FIELD_VALUE_MAP = {
    OpportunityStatus.POSTED: "Open",
    True: "Yes",
    False: "No"
}

SECTION_STYLING = '<p style="margin-left: 20px;">{}</p>'
BULLET_POINTS_STYLING = f'<p style="margin-left: 40px;">• '

class OpportunityNotificationTask(BaseNotificationTask):
    def __init__(self, db_session: db.Session, frontend_base_url: str | None = None):
        super().__init__(db_session)
        self.frontend_base_url = frontend_base_url
        self.opportunity_content: dict[UUID, str] = {}

    def collect_email_notifications(self) -> list[UserEmailNotification]:
        """Collect notifications for changed opportunities that users are tracking"""
        # Create row_number window function
        row_number = func.row_number().over(
            partition_by=OpportunityVersion.opportunity_id,
            order_by=desc(OpportunityVersion.created_at)
        ).label("rn")

        # Subquery that assigns row numbers
        latest_versions_subq = (
            select(OpportunityVersion, row_number)
            .subquery()
        )

        latest_opp_version = aliased(OpportunityVersion, latest_versions_subq)

        stmt = (
            select(UserSavedOpportunity,latest_opp_version)
            .options(selectinload(UserSavedOpportunity.user))
            .outerjoin(
                latest_opp_version,
                UserSavedOpportunity.opportunity_id == latest_opp_version.opportunity_id
            )
        )

        results = self.db_session.execute(stmt).all()
        if not results:
            logger.info("No user-opportunity tracking records found.")
            return []

        changed_saved_opportunities: dict[UUID, dict] = {}
        user_opportunity_pairs : list = []
        none_versioned_opportunities: list = []
        for user_saved_opp, latest_opp_ver in results:
            if latest_opp_ver is None:
                logger.error(
                    "No prior version recorded for this opportunity;",
                    extra={"opportunity_id": user_saved_opp.opportunity_id},
                )
                none_versioned_opportunities.append(user_saved_opp.opportunity_id)
                continue

            if user_saved_opp.last_notified_at < latest_opp_ver.created_at:
                user_id = user_saved_opp.user_id
                opp_id = user_saved_opp.opportunity_id
                changed_saved_opportunities.setdefault(user_id, {
                    "email": user_saved_opp.user.email,
                    "opportunities": {}
                })["opportunities"][opp_id] = {
                    "latest": latest_opp_ver,
                    "previous": {}
                }

                user_opportunity_pairs.append((user_id, opp_id))

        self.increment(Metrics.NONE_VERSIONED_OPPORTUNITIES, len(none_versioned_opportunities))

        # Grab last notified versions.
        prior_notified_versions = self._get_last_notified_versions(user_opportunity_pairs)

        users_email_notifications: list[UserEmailNotification] = []

        for user_id, data in changed_saved_opportunities.items():
            user_email = data["email"]
            if not user_email:
                logger.warning("No email found for user", extra={"user_id": user_id})
                continue

            updated_opps = data["opportunities"]

            for opp_id, versions in updated_opps.items():
                versions["previous"] = prior_notified_versions.get((user_id, opp_id))

            subject, message, updated_opp_ids = self._build_notification_content(updated_opps)

            if message:
                logger.info(
                    "Created changed opportunity email notifications",
                    extra={"user_id": user_id, "changed_opportunities_count": len(updated_opp_ids)},
                )
                users_email_notifications.append(
                    UserEmailNotification(
                        user_id=user_id,
                        user_email=user_email,
                        subject=subject,
                        content=message,
                        notification_reason=NotificationReason.OPPORTUNITY_UPDATES,
                        notified_object_ids=updated_opp_ids,
                        is_notified=False,  # Default to False, update on success
                    )
                )

        logger.info(
            "Collected updated opportunity notifications",
            extra={
                "user_count": len(users_email_notifications),
                "total_opportunities_count": len(self.opportunity_content)
            },
        )

        return users_email_notifications

    def _get_last_notified_versions(self, user_opportunity_pairs: list) -> dict[tuple[UUID, UUID], OpportunityVersion]:
        """
        Given (user_id, opportunity_id) pairs, return the most recent
        OpportunityVersion for each that was created before the user's
        last_notified_at timestamp.
        """
        latest_versions_subq = (
            select(OpportunityVersion)
            .join(
                UserSavedOpportunity,
                OpportunityVersion.opportunity_id == UserSavedOpportunity.opportunity_id
            )
            .where(
                tuple_(
                    UserSavedOpportunity.user_id,
                    UserSavedOpportunity.opportunity_id
                ).in_(user_opportunity_pairs),
                OpportunityVersion.created_at <= UserSavedOpportunity.last_notified_at
            )
            .order_by(
                OpportunityVersion.opportunity_id,
                desc(OpportunityVersion.created_at)
            )
            .distinct(OpportunityVersion.opportunity_id)
            .subquery()
        )

        latest_opp_version = aliased(OpportunityVersion, latest_versions_subq)

        stmt = (
            select(UserSavedOpportunity, latest_opp_version)
            .options(selectinload(UserSavedOpportunity.user))
            .join(
                latest_opp_version,
                UserSavedOpportunity.opportunity_id == latest_opp_version.opportunity_id
            )
            .where(
                tuple_(
                    UserSavedOpportunity.user_id,
                    UserSavedOpportunity.opportunity_id
                ).in_(user_opportunity_pairs)
            )
        )

        result = self.db_session.execute(stmt).all()
        prior_notified_versions = {
            (user_saved_opp.user_id, user_saved_opp.opportunity_id): version
            for user_saved_opp, version in result
        }

        return prior_notified_versions

    def _build_opportunity_content(self,  opp_id: UUID, diffs: list) -> str:
        status_section = ""
        important_section = ""
        award_section = ""
        category_section = ""
        description_section = ""
        eligibility_section = ""
        grantor_section = ""
        documents_section = ""

        for diff in diffs:
            field = diff["field"]
            before = diff["before"]
            after = diff["after"]

            # cleanup dates
            if isinstance(before, datetime):
                before = before.strftime("%B %d, %Y")
            if isinstance(after, datetime):
                after = after.strftime("%B %d, %Y")

            if field == "opportunity_status":
                before = FIELD_VALUE_MAP.get(before, before)
                after = FIELD_VALUE_MAP.get(after, after)

                status_section += (
                    SECTION_STYLING.format("Status") +
                    f"{BULLET_POINTS_STYLING} The status changed from {before} to {after}.<br><br>"
                )

            if field in IMPORTANT_DATE_FIELDS:
                if not important_section:
                    important_section += "&nbsp;&nbsp;&nbsp;&nbsp;Important dates<br><br>"
                important_section += f"{BULLET_POINTS_STYLING} {IMPORTANT_DATE_FIELDS[field]} {before} to {after}.<br>"

            if field in AWARD_FIELDS:
                if not award_section:
                    SECTION_STYLING.format("Award details")
                award_section += (
                    f"{BULLET_POINTS_STYLING} {AWARD_FIELDS[field]} {before} to {after}.<br>"
                )

            if field in CATEGORIZATION_FIELDS:
                if not category_section:
                    category_section = SECTION_STYLING.format("Categorization")
                if field == "is_cost_sharing":
                    before = FIELD_VALUE_MAP.get(before, before)
                    after = FIELD_VALUE_MAP.get(after, after)

                if field == "category_explanation" or field == "funding_category_description":
                    if not after:
                        continue

                category_section += f'{BULLET_POINTS_STYLING} {CATEGORIZATION_FIELDS[field]} {before} to {after}.<br>'

            if field == "summary_description":
                max_char = 250
                truncated_after = after[:max_char]
                if len(after) > max_char:
                    truncated_after += f"... <a href='{self.frontend_base_url}/opportunity/{opp_id}' style='color:blue;'>Read full description</a>"
                description_section += (
                    SECTION_STYLING.format("Description") +
                    f"{BULLET_POINTS_STYLING} New Description: {truncated_after}.<br>"
                )
            if field in ELIGIBILITY_FIELDS:
                if not eligibility_section:
                    eligibility_section = SECTION_STYLING.format("Eligibility")
                if field == "applicant_types":
                    added = set(after) - set(before)
                    removed = set(before) - set(after)
                    stmt = ELIGIBILITY_FIELDS["applicant_types"]
                    if added:
                        eligibility_section += (
                            f"{BULLET_POINTS_STYLING} Additional {stmt} {list(added)}.<br>"
                        )
                    if removed:
                        eligibility_section += (
                            f"{BULLET_POINTS_STYLING} Removed {stmt} {list(removed)}.<br>"
                        )

                if field == "applicant_eligibility_description":
                    stmt = f"{BULLET_POINTS_STYLING} {ELIGIBILITY_FIELDS["applicant_eligibility_description"]}"

                    if not before and after:
                        eligibility_section += f"{stmt} added.<br>"
                    elif before and not after:
                        eligibility_section += f"{stmt} removed.<br>"
                    else:
                        eligibility_section += f"{stmt} updated.<br>"

            if field in GRANTOR_CONTACT_INFORMATION_FIELDS:
                if not grantor_section:
                    grantor_section =  SECTION_STYLING.format("Grantor contact information")
                grantor_section += f"{BULLET_POINTS_STYLING} {GRANTOR_CONTACT_INFORMATION_FIELDS[field]} {after}.<br>"

            if field in DOCUMENTS_FIELDS:
                if not documents_section:
                    documents_section = SECTION_STYLING.format("Documents")
                if field == "attachments":

                    before_set = set(json.dumps(d, sort_keys=True) for d in before)
                    after_set = set(json.dumps(d, sort_keys=True) for d in after)

                    if after_set - before_set:
                        documents_section += f"{BULLET_POINTS_STYLING} {DOCUMENTS_FIELDS["attachments"]} added.<br>"
                    if before_set - after_set:
                        documents_section += f"{BULLET_POINTS_STYLING} {DOCUMENTS_FIELDS["attachments"]} removed.<br>"

                if field == "additional_info_url":
                    stmt = f"{BULLET_POINTS_STYLING} {DOCUMENTS_FIELDS["additional_info_url"]}"
                    if not before and after:
                        eligibility_section += f"{stmt} added.<br>"
                    elif before and not after:
                        eligibility_section += f"{stmt} removed.<br>"

        change_sections = (
                status_section
                + important_section
                + award_section
                + category_section
                + description_section
                + eligibility_section
                + grantor_section
                + documents_section
        )

        return   change_sections

    def _build_notification_content(
        self, updated_saved_opps: dict[UUID, dict[str, OpportunityVersion]]
    ) -> tuple[str ,str] | tuple[str,str, list] | tuple[None,None, None]:

        all_changes_message = ""
        changed_opp_ids: list= []

        for opp_id, version in updated_saved_opps.items():
            if opp_id not in self.opportunity_content:
                latest_opp = version["latest"].opportunity_data
                previous_opp = version["previous"].opportunity_data
                diffs = diff_nested_dicts(latest_opp, previous_opp)
                if not diffs:
                    logger.info(
                        "No diffs found between current and previously notified versions",
                        extra={"opportunity_id": opp_id},
                    )
                    continue

                change_sections = self._build_opportunity_content(opp_id, diffs)

                if change_sections:
                    self.opportunity_content[opp_id] = change_sections

                else:
                    ignored_fields = [diff["field"] for diff in diffs]
                    logger.info(
                        "Opportunity has changes, but none are in fields that trigger user notifications",
                        extra={
                            "opportunity_id": opp_id,
                            "ignored_fields": ignored_fields,
                        },
                    )
                    continue


            changed_opp_ids.append(opp_id)
            change_message = (
                "<div>"
                f"{len(changed_opp_ids)}. <a href='{self.frontend_base_url}/opportunity/{opp_id}' target='_blank'>{version["latest"].opportunity_data["opportunity_title"]}</a><br><br>"
                "Here’s what changed:"
                "</div>"
            )
            all_changes_message += change_message + self.opportunity_content[opp_id]

        if not all_changes_message:
            return None, None, None

        intro = (
            "The following funding opportunities recently changed:<br><br>"
            if len(changed_opp_ids) > 1
            else "The following funding opportunity recently changed:<br><br>"
        )
        additional_msg = (
            "<div>"
            "<strong>Please carefully read the opportunity listing pages to review all changes.</strong> <br><br>"
            f"<a href='{self.frontend_base_url}' target='_blank' style='color:blue;'>Sign in to Simpler.Grants.gov to manage your saved opportunities.</a>"
            "</div><br>"
        )
        message = intro + all_changes_message + additional_msg + CONTACT_INFO

        subject = (
            "Your saved funding opportunities changed on"
            if  len(changed_opp_ids) > 1
            else "Your saved funding opportunity changed on"
        )

        return subject, message, changed_opp_ids

    def post_notifications_process(self, user_notifications: list[UserEmailNotification]) -> None:
        for user_notification in user_notifications:
            if user_notification.is_notified:
                self.db_session.execute(
                    update(UserSavedOpportunity)
                    .where(
                        UserSavedOpportunity.user_id == user_notification.user_id,
                        UserSavedOpportunity.opportunity_id.in_(
                            user_notification.notified_object_ids
                        ),
                    )
                    .values(last_notified_at=datetime_util.utcnow())
                )

                logger.info(
                    "Updated notification log",
                    extra={
                        "user_id": user_notification.user_id,
                        "opportunity_ids": user_notification.notified_object_ids,
                        "notification_reason": user_notification.notification_reason,
                    },
                )

                self.increment(
                    Metrics.OPPORTUNITIES_TRACKED, len(user_notification.notified_object_ids)
                )
