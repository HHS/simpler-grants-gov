import logging
from datetime import datetime
from typing import Sequence, cast
from uuid import UUID

from sqlalchemy import and_, desc, exists, func, select, tuple_, update
from sqlalchemy.orm import aliased, selectinload

from src.adapters import db
from src.api.opportunities_v1.opportunity_schemas import OpportunityVersionV1Schema
from src.constants.lookup_constants import FundingCategory, OpportunityCategory, OpportunityStatus
from src.db.models.opportunity_models import OpportunityVersion
from src.db.models.user_models import LinkExternalUser, SuppressedEmail, UserSavedOpportunity
from src.task.notifications.base_notification import BaseNotificationTask
from src.task.notifications.config import EmailNotificationConfig
from src.task.notifications.constants import (
    ChangedSavedOpportunity,
    NotificationReason,
    OpportunityVersionChange,
    UserEmailNotification,
    UserOpportunityUpdateContent,
)
from src.util import datetime_util
from src.util.dict_util import diff_nested_dicts

logger = logging.getLogger(__name__)

SCHEMA = OpportunityVersionV1Schema()

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
    "funding_category_description": "The funding activity category explanation has been changed from",
}
ELIGIBILITY_FIELDS = {
    "applicant_types": "eligibility criteria include:",
    "applicant_eligibility_description": "Additional information was",
}
GRANTOR_CONTACT_INFORMATION_FIELDS = {
    "agency_email_address": "The updated email address is",
    "agency_contact_description": "New description:",
}
DOCUMENTS_FIELDS = {
    "opportunity_attachments": "One or more new documents were",  # temporarily skip opportunity_attachment change
    "additional_info_url": "A link to additional information was updated.",
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


OPPORTUNITY_STATUS_MAP = {
    OpportunityStatus.POSTED: "Open",
}

SECTION_STYLING = '<p style="padding-left: 20px;">{}</p>'
BULLET_POINTS_STYLING = '<p style="padding-left: 40px;">• '
NOT_SPECIFIED = "not specified"  # If None value display this string
TRUNCATION_THRESHOLD = 250

UTM_TAG = "?utm_source=notification&utm_medium=email&utm_campaign=opportunity_update"


class OpportunityNotificationTask(BaseNotificationTask):
    def __init__(self, db_session: db.Session, notification_config: EmailNotificationConfig):
        super().__init__(db_session, notification_config)

    def collect_email_notifications(self) -> list[UserEmailNotification]:
        """Collect notifications for changed opportunities that users are tracking"""
        results = self._get_latest_opportunity_versions()

        if not results:
            logger.info("No user-opportunity tracking records found.")
            return []

        changed_saved_opportunities: list[ChangedSavedOpportunity] = []
        user_opportunity_pairs: list = []
        versionless_opportunities: set = set()

        for user_saved_opp, latest_opp_ver in results:
            if latest_opp_ver is None:
                logger.error(
                    "No prior version recorded for this opportunity;",
                    extra={"opportunity_id": user_saved_opp.opportunity_id},
                )
                versionless_opportunities.add(user_saved_opp.opportunity_id)
                continue

            if user_saved_opp.last_notified_at < latest_opp_ver.created_at:
                user_id = user_saved_opp.user_id
                opp_id = user_saved_opp.opportunity_id

                version_change = OpportunityVersionChange(
                    opportunity_id=opp_id, latest=latest_opp_ver, previous=None  # will update later
                )

                saved_opp_exists = False
                for entry in changed_saved_opportunities:
                    if entry.user_id == user_id:
                        entry.opportunities.append(version_change)
                        saved_opp_exists = True
                        break

                if not saved_opp_exists:
                    changed_saved_opportunities.append(
                        ChangedSavedOpportunity(
                            user_id=user_id,
                            email=user_saved_opp.user.email,
                            opportunities=[version_change],
                        )
                    )

                user_opportunity_pairs.append((user_id, opp_id))

        self.increment(self.Metrics.VERSIONLESS_OPPORTUNITY_COUNT, len(versionless_opportunities))

        # Grab last notified versions.
        prior_notified_versions = self._get_last_notified_versions(user_opportunity_pairs)

        users_email_notifications: list[UserEmailNotification] = []
        for user_changed_opp in changed_saved_opportunities:
            user_id = user_changed_opp.user_id
            user_email = user_changed_opp.email
            if not user_email:
                logger.warning("No email found for user", extra={"user_id": user_id})
                continue

            updated_opps: list[OpportunityVersionChange] = []
            for opp in user_changed_opp.opportunities:
                opp.previous = prior_notified_versions.get(
                    (user_changed_opp.user_id, opp.opportunity_id)
                )
                if opp.previous is None:
                    logger.error(
                        "No previous version found for this opportunity",
                        extra={"user_id": user_id, "opportunity_id": opp.opportunity_id},
                    )
                    continue
                updated_opps.append(opp)

            if not updated_opps:
                logger.warning(
                    "No opportunities with prior versions for user", extra={"user_id": user_id}
                )
                continue

            user_content = self._build_notification_content(updated_opps)
            if not user_content:
                logger.info("No relevant notifications found for user", extra={"user_id": user_id})
                continue

            logger.info(
                "Created changed opportunity email notifications",
                extra={
                    "user_id": user_id,
                    "changed_opportunities_count": len(user_content.updated_opportunity_ids),
                },
            )
            users_email_notifications.append(
                UserEmailNotification(
                    user_id=user_id,
                    user_email=user_email,
                    subject=user_content.subject,
                    content=user_content.message,
                    notification_reason=NotificationReason.OPPORTUNITY_UPDATES,
                    notified_object_ids=user_content.updated_opportunity_ids,
                    is_notified=False,  # Default to False, update on success
                )
            )

        logger.info(
            "Collected updated opportunity notifications",
            extra={
                "user_count": len(users_email_notifications),
                "total_opportunities_count": sum(
                    len(opp.opportunities) for opp in changed_saved_opportunities
                ),
            },
        )

        return users_email_notifications

    def _get_latest_opportunity_versions(self) -> Sequence:
        """
        Retrieve the latest OpportunityVersion for each opportunity saved by users.
        """
        # Rank all versions per opportunity_id, by created_at descending
        row_number = (
            func.row_number()
            .over(
                partition_by=OpportunityVersion.opportunity_id,
                order_by=desc(OpportunityVersion.created_at),
            )
            .label("rn")
        )

        # Subquery selecting all OpportunityVersions along with their row number rank
        latest_versions_subq = select(OpportunityVersion, row_number).subquery()

        # Map cols in the subquery back to OpportunityVersion model
        latest_opp_version = aliased(OpportunityVersion, latest_versions_subq)

        # Grab latest version for each active UserSavedOpportunity
        stmt = (
            select(UserSavedOpportunity, latest_opp_version)
            .options(selectinload(UserSavedOpportunity.user))
            .outerjoin(
                latest_opp_version,
                and_(
                    UserSavedOpportunity.opportunity_id == latest_opp_version.opportunity_id,
                    latest_versions_subq.c.rn == 1,
                ),
            )
            .where(
                UserSavedOpportunity.is_deleted.isnot(True),
                ~exists().where(
                    and_(
                        SuppressedEmail.email == LinkExternalUser.email,
                        LinkExternalUser.user_id == UserSavedOpportunity.user_id,
                    )
                ),
            )
        )

        results = self.db_session.execute(stmt).all()

        return results

    def _get_last_notified_versions(
        self, user_opportunity_pairs: list
    ) -> dict[tuple[UUID, UUID], OpportunityVersion]:
        """
        Given (user_id, opportunity_id) pairs, return the most recent
        OpportunityVersion for each that was created before the user's
        last_notified_at timestamp.
        """
        # Rank all versions per (user, opportunity_id) by created_at desc
        row_number = (
            func.row_number()
            .over(
                partition_by=(UserSavedOpportunity.user_id, OpportunityVersion.opportunity_id),
                order_by=desc(OpportunityVersion.created_at),
            )
            .label("rn")
        )
        # Subquery selecting all OpportunityVersions joined with UserSavedOpportunity,
        # filtered by the given user-opportunity pairs, and versions created before last_notified_at
        subq = (
            select(OpportunityVersion, UserSavedOpportunity.user_id.label("user_id"), row_number)
            .join(
                UserSavedOpportunity,
                UserSavedOpportunity.opportunity_id == OpportunityVersion.opportunity_id,
            )
            .where(
                tuple_(UserSavedOpportunity.user_id, UserSavedOpportunity.opportunity_id).in_(
                    user_opportunity_pairs
                ),  # Filter for the given pairs
                OpportunityVersion.created_at
                < UserSavedOpportunity.last_notified_at,  # Grabs the versions created before the users last notification
            )
            .subquery()
        )

        # Map cols in the subquery back to OpportunityVersion model
        opp_version_from_subq = aliased(OpportunityVersion, subq)

        # Grabs latest version per (user, opportunity_id) pairs
        stmt = select(
            subq.c.user_id,
            subq.c.opportunity_id,
            opp_version_from_subq,  # OpportunityVersion object
        ).where(subq.c.rn == 1)

        results = self.db_session.execute(stmt).all()

        return {(row.user_id, row.opportunity_id): row[2] for row in results}

    def _build_description_fields_content(self, description_change: dict) -> str:
        after = description_change["after"]
        if after:
            description_section = SECTION_STYLING.format("Description")
            description_section += f"{BULLET_POINTS_STYLING} The description has changed.<br>"
            return description_section
        return ""

    def _normalize_bool_field(self, value: bool | None) -> str:
        if value is None:
            return NOT_SPECIFIED
        return "Yes" if value else "No"

    def _skip_category_explanation(self, category_change: dict, field_name: str) -> bool:
        change = category_change.get(field_name)
        if change and (
            change["before"] == OpportunityCategory.OTHER
            or OpportunityCategory.OTHER != change["after"]
        ):
            return True
        return False

    def _skip_funding_category_description(self, category_change: dict, field_name: str) -> bool:
        change = category_change.get(field_name)
        if change and (
            FundingCategory.OTHER in change["before"]
            or FundingCategory.OTHER not in change["after"]
        ):
            return True
        return False

    def _format_slug(self, slug: str) -> str:
        return slug.replace("_", " ").capitalize()

    def _build_categorization_fields_content(self, category_change: dict) -> str:
        category_section = SECTION_STYLING.format("Categorization")
        for field, change in category_change.items():
            before = change["before"]
            after = change["after"]
            if field == "is_cost_sharing":
                before = self._normalize_bool_field(before)
                after = self._normalize_bool_field(after)
            elif field in ["funding_instruments", "funding_categories"]:
                before = ", ".join([self._format_slug(value) for value in before])
                after = ", ".join([self._format_slug(value) for value in after])
            elif field == "category":
                before = before.capitalize() if before else NOT_SPECIFIED
                after = after.capitalize() if after else NOT_SPECIFIED
            elif field == "category_explanation":
                # If category changes from Other to Any other field do not show category explanation as it is only relevant to OpportunityCategory.Other
                if self._skip_category_explanation(category_change, "category"):
                    continue
                before = before.capitalize() if before else NOT_SPECIFIED
                after = after.capitalize() if after else NOT_SPECIFIED
            elif field == "funding_category_description":
                # If funding_categories changes from Other to Any other field do not show funding category description as it is only relevant to funding_categories.Other
                if self._skip_funding_category_description(category_change, "funding_categories"):
                    continue
                before = before.capitalize() if before else NOT_SPECIFIED
                after = after.capitalize() if after else NOT_SPECIFIED

            category_section += (
                f"{BULLET_POINTS_STYLING} {CATEGORIZATION_FIELDS[field]} {before} to {after}.<br>"
            )
        return category_section

    def _build_eligibility_content(self, eligibility_change: dict) -> str:
        eligibility_section = SECTION_STYLING.format("Eligibility")
        for field, change in eligibility_change.items():
            before = change["before"]
            after = change["after"]
            if field == "applicant_types":
                added = sorted(set(after) - set(before))
                removed = sorted(set(before) - set(after))
                stmt = ELIGIBILITY_FIELDS["applicant_types"]
                if added:
                    eligibility_section += f"{BULLET_POINTS_STYLING} Additional {stmt} [{", ".join(f"{self._format_slug(e_type)}" for e_type in added)}].<br>"
                if removed:
                    eligibility_section += f"{BULLET_POINTS_STYLING} Removed {stmt} [{", ".join(f"{self._format_slug(e_type)}" for e_type in removed)}].<br>"

            if field == "applicant_eligibility_description":
                stmt = f"{BULLET_POINTS_STYLING} {ELIGIBILITY_FIELDS["applicant_eligibility_description"]}"
                if not before and after:
                    eligibility_section += f"{stmt} added.<br>"
                elif before and not after:
                    eligibility_section += f"{stmt} deleted.<br>"
                else:
                    eligibility_section += f"{stmt} changed.<br>"
        return eligibility_section

    def _build_documents_fields(self, documents_change: dict) -> str:
        documents_section = SECTION_STYLING.format("Documents")
        for field, change in documents_change.items():
            before = change["before"]
            after = change["after"]

            if field == "opportunity_attachments":
                before_set = set(att["attachment_id"] for att in (before or []))
                after_set = set(att["attachment_id"] for att in (after or []))

                if after_set - before_set:
                    documents_section += f"{BULLET_POINTS_STYLING} {DOCUMENTS_FIELDS["opportunity_attachments"]} added.<br>"
                if before_set - after_set:
                    documents_section += f"{BULLET_POINTS_STYLING} {DOCUMENTS_FIELDS["opportunity_attachments"]} removed.<br>"

            elif field == "additional_info_url":
                documents_section += (
                    f"{BULLET_POINTS_STYLING} {DOCUMENTS_FIELDS["additional_info_url"]}<br>"
                )

        return documents_section

    def _format_currency(self, value: int | str) -> str:
        if isinstance(value, int):
            return f"${value:,}"
        return value

    def _build_award_fields_content(self, award_change: dict) -> str:
        award_section = SECTION_STYLING.format("Awards details")
        for field, change in award_change.items():
            before = change["before"] if change["before"] else NOT_SPECIFIED
            after = change["after"] if change["after"] else NOT_SPECIFIED
            if field != "expected_number_of_awards":
                before = self._format_currency(before)
                after = self._format_currency(after)

            award_section += (
                f"{BULLET_POINTS_STYLING} {AWARD_FIELDS[field]} {before} to {after}.<br>"
            )
        return award_section

    def _build_grantor_contact_fields_content(self, contact_change: dict) -> str:
        contact_section = SECTION_STYLING.format("Grantor contact information")
        for field, change in contact_change.items():
            after = change["after"] if change["after"] else NOT_SPECIFIED
            if len(after) > TRUNCATION_THRESHOLD:
                after = after[: TRUNCATION_THRESHOLD - 3] + ".."

            contact_section += f"{BULLET_POINTS_STYLING} {GRANTOR_CONTACT_INFORMATION_FIELDS[field]} {after.replace("\n", "<br>")}.<br>"
        return contact_section

    def _normalize_date_field(self, value: str | int | None) -> str | int | None:
        if isinstance(value, str):
            return datetime.strptime(value, "%Y-%m-%d").strftime("%B %-d, %Y")
        elif not value:
            return NOT_SPECIFIED
        return value

    def _build_important_dates_content(
        self, imp_dates_change: dict, opportunity_status: dict | None
    ) -> str:
        relevant_changes = []
        for field, change in imp_dates_change.items():
            before = self._normalize_date_field(change["before"])
            after = self._normalize_date_field(change["after"])
            if field != "close_date":
                if (
                    opportunity_status
                    and opportunity_status["before"] == OpportunityStatus.FORECASTED
                ):
                    continue
            relevant_changes.append(
                f"{BULLET_POINTS_STYLING} {IMPORTANT_DATE_FIELDS[field]} {before} to {after}.<br>"
            )

        if not relevant_changes:
            return ""
        important_section = SECTION_STYLING.format("Important dates")
        return important_section + "".join(relevant_changes)

    def _build_opportunity_status_content(self, status_change: dict) -> str:
        before = status_change["before"]
        after = status_change["after"]

        before = OPPORTUNITY_STATUS_MAP.get(before, before.capitalize())
        after = OPPORTUNITY_STATUS_MAP.get(after, after.capitalize())

        return (
            SECTION_STYLING.format("Status")
            + f"{BULLET_POINTS_STYLING} The status changed from {before} to {after}.<br>"
        )

    def _flatten_and_extract_field_changes(self, diffs: list) -> dict:
        return {
            diff["field"].split(".")[-1]: {"before": diff["before"], "after": diff["after"]}
            for diff in diffs
        }

    def _build_sections(self, opp_change: OpportunityVersionChange) -> str:
        # Get diff between latest and previous version
        previous = cast(OpportunityVersion, opp_change.previous)

        diffs = diff_nested_dicts(previous.opportunity_data, opp_change.latest.opportunity_data)

        # Transform diffs
        changes = self._flatten_and_extract_field_changes(diffs)
        sections = []
        if "opportunity_status" in changes:
            sections.append(self._build_opportunity_status_content(changes["opportunity_status"]))
        if important_date_diffs := {k: changes[k] for k in IMPORTANT_DATE_FIELDS if k in changes}:
            sections.append(
                self._build_important_dates_content(
                    important_date_diffs, changes.get("opportunity_status", None)
                )
            )
        if award_fields_diffs := {k: changes[k] for k in AWARD_FIELDS if k in changes}:
            sections.append(self._build_award_fields_content(award_fields_diffs))
        if categorization_fields_diffs := {
            k: changes[k] for k in CATEGORIZATION_FIELDS if k in changes
        }:
            sections.append(self._build_categorization_fields_content(categorization_fields_diffs))
        if grantor_contact_fields_diffs := {
            k: changes[k] for k in GRANTOR_CONTACT_INFORMATION_FIELDS if k in changes
        }:
            sections.append(
                self._build_grantor_contact_fields_content(grantor_contact_fields_diffs)
            )
        if eligibility_fields_diffs := {k: changes[k] for k in ELIGIBILITY_FIELDS if k in changes}:
            sections.append(self._build_eligibility_content(eligibility_fields_diffs))
        if "additional_info_url" in changes:
            sections.append(
                self._build_documents_fields(
                    {"additional_info_url": changes["additional_info_url"]}
                )
            )
        if "summary_description" in changes:
            sections.append(self._build_description_fields_content(changes["summary_description"]))
        if not sections:
            logger.info(
                "Opportunity has changes, but none are in fields that trigger user notifications",
                extra={
                    "opportunity_id": opp_change.opportunity_id,
                    "ignored_fields": changes.keys(),
                },
            )
        return "<br>".join(sections)

    def _build_notification_content(
        self, updated_opportunities: list[OpportunityVersionChange]
    ) -> UserOpportunityUpdateContent | None:

        closing_msg = (
            "<div>"
            "<strong>Please carefully read the opportunity listing pages to review all changes.</strong><br><br>"
            f"<a href='{self.notification_config.frontend_base_url}{UTM_TAG}' target='_blank' style='color:blue;'>Sign in to Simpler.Grants.gov to manage your saved opportunities.</a>"
            "</div>"
        ) + CONTACT_INFO

        all_sections = ""
        updated_opp_ids = []
        opp_count = 1
        # Get sections statement
        for opp in updated_opportunities:
            opp_id = opp.opportunity_id
            sections = self._build_sections(opp)
            if not sections:
                continue

            all_sections += (
                "<div>"
                f"{opp_count}. <a href='{self.notification_config.frontend_base_url}/opportunity/{opp_id}{UTM_TAG}' target='_blank'>{opp.latest.opportunity_data["opportunity_title"]}</a><br><br>"
                "Here’s what changed:"
                "</div>"
            ) + sections

            opp_count += 1
            updated_opp_ids.append(opp_id)

        if not all_sections:
            return None
        updated_opp_count = len(updated_opp_ids)
        intro = (
            "The following funding opportunities recently changed:<br><br>"
            if updated_opp_count > 1
            else "The following funding opportunity recently changed:<br><br>"
        )
        subject = (
            "Your saved funding opportunities changed on "
            if updated_opp_count > 1
            else "Your saved funding opportunity changed on "
        )
        subject += "Simpler.Grants.gov"

        return UserOpportunityUpdateContent(
            subject=subject,
            message=intro + all_sections + closing_msg,
            updated_opportunity_ids=updated_opp_ids,
        )

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
                    self.Metrics.OPPORTUNITIES_TRACKED, len(user_notification.notified_object_ids)
                )
