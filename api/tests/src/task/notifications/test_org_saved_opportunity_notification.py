import pytest
from sqlalchemy import select

import tests.src.db.models.factories as factories
from src.adapters.aws.pinpoint_adapter import _clear_mock_responses, _get_mock_responses
from src.db.models.entity_models import OrganizationSavedOpportunity
from src.db.models.user_models import SuppressedEmail, UserNotificationLog
from src.task.notifications.config import EmailNotificationConfig
from src.task.notifications.constants import NotificationReason
from src.task.notifications.org_saved_opportunity_notification import (
    OrgSavedOpportunityNotificationTask,
)
from src.util import datetime_util
from tests.lib.db_testing import cascade_delete_from_db_table


class TestOrgSavedOpportunityNotification:
    notification_config: EmailNotificationConfig

    @pytest.fixture
    def configuration(self, monkeypatch):
        monkeypatch.setenv("AWS_PINPOINT_APP_ID", "test-app-id")
        self.notification_config = EmailNotificationConfig()
        self.notification_config.reset_emails_without_sending = False

    @pytest.fixture(autouse=True)
    def clear_data(self, db_session):
        cascade_delete_from_db_table(db_session, UserNotificationLog)
        cascade_delete_from_db_table(db_session, OrganizationSavedOpportunity)
        cascade_delete_from_db_table(db_session, SuppressedEmail)

    @pytest.fixture
    def user_with_email(self, db_session, user, enable_factory_create):
        factories.LinkExternalUserFactory.create(user=user, email="test@example.com")
        return user

    @pytest.fixture
    def org_with_user(self, db_session, user_with_email, enable_factory_create):
        """Create an organization with the test user as a member, with notifications enabled."""
        org = factories.OrganizationFactory.create()
        factories.OrganizationUserFactory.create(organization=org, user=user_with_email)
        # Enable org notifications for this user
        factories.UserSavedOpportunityNotificationFactory.create(
            user=user_with_email,
            organization=org,
            email_enabled=True,
        )
        return org

    def test_happy_path_sends_email(
        self,
        db_session,
        enable_factory_create,
        user_with_email,
        org_with_user,
        configuration,
    ):
        """Test that email is sent when org has unprocessed saved opportunity."""
        opportunity = factories.OpportunityFactory.create()
        factories.OrganizationSavedOpportunityFactory.create(
            organization=org_with_user,
            opportunity=opportunity,
        )

        _clear_mock_responses()
        task = OrgSavedOpportunityNotificationTask(db_session, self.notification_config)
        task.run()

        # Verify notification log was created
        notification_logs = (
            db_session.execute(
                select(UserNotificationLog).where(
                    UserNotificationLog.notification_reason
                    == NotificationReason.ORG_SAVED_OPPORTUNITY
                )
            )
            .scalars()
            .all()
        )
        assert len(notification_logs) == 1
        assert notification_logs[0].notification_sent is True
        assert notification_logs[0].user_id == user_with_email.user_id

        # Verify email was sent via Pinpoint
        mock_responses = _get_mock_responses()
        assert len(mock_responses) == 1

    def test_no_email_sent_on_second_run(
        self,
        db_session,
        enable_factory_create,
        user_with_email,
        org_with_user,
        configuration,
    ):
        """Test that no email is sent on second run (notification_processed_at is already set)."""
        opportunity = factories.OpportunityFactory.create()
        factories.OrganizationSavedOpportunityFactory.create(
            organization=org_with_user,
            opportunity=opportunity,
        )

        _clear_mock_responses()
        task = OrgSavedOpportunityNotificationTask(db_session, self.notification_config)
        task.run()

        # Verify email sent on first run
        assert len(_get_mock_responses()) == 1

        _clear_mock_responses()
        # Run again - no new email should be sent
        task2 = OrgSavedOpportunityNotificationTask(db_session, self.notification_config)
        task2.run()

        assert len(_get_mock_responses()) == 0

    def test_new_opportunity_triggers_new_email(
        self,
        db_session,
        enable_factory_create,
        user_with_email,
        org_with_user,
        configuration,
    ):
        """Test that adding a new saved opportunity to an org triggers a new email."""
        opportunity1 = factories.OpportunityFactory.create()
        factories.OrganizationSavedOpportunityFactory.create(
            organization=org_with_user,
            opportunity=opportunity1,
        )

        _clear_mock_responses()
        task = OrgSavedOpportunityNotificationTask(db_session, self.notification_config)
        task.run()
        assert len(_get_mock_responses()) == 1

        # Add a new opportunity to the org
        opportunity2 = factories.OpportunityFactory.create()
        factories.OrganizationSavedOpportunityFactory.create(
            organization=org_with_user,
            opportunity=opportunity2,
        )

        _clear_mock_responses()
        task2 = OrgSavedOpportunityNotificationTask(db_session, self.notification_config)
        task2.run()
        assert len(_get_mock_responses()) == 1

    def test_user_without_org_notifications_enabled_receives_no_email(
        self,
        db_session,
        enable_factory_create,
        user_with_email,
        configuration,
    ):
        """Test that user without org notifications enabled does not receive email."""
        org = factories.OrganizationFactory.create()
        factories.OrganizationUserFactory.create(organization=org, user=user_with_email)
        # Create notification setting with email_enabled=False (or no row at all defaults to False)
        factories.UserSavedOpportunityNotificationFactory.create(
            user=user_with_email,
            organization=org,
            email_enabled=False,
        )

        opportunity = factories.OpportunityFactory.create()
        factories.OrganizationSavedOpportunityFactory.create(
            organization=org,
            opportunity=opportunity,
        )

        _clear_mock_responses()
        task = OrgSavedOpportunityNotificationTask(db_session, self.notification_config)
        task.run()

        mock_responses = _get_mock_responses()
        assert len(mock_responses) == 0

    def test_user_with_no_notification_row_receives_no_email(
        self,
        db_session,
        enable_factory_create,
        user_with_email,
        configuration,
    ):
        """Test that user with no org notification row (default=False) receives no email."""
        org = factories.OrganizationFactory.create()
        factories.OrganizationUserFactory.create(organization=org, user=user_with_email)
        # No UserSavedOpportunityNotification row - default for org is email_enabled=False

        opportunity = factories.OpportunityFactory.create()
        factories.OrganizationSavedOpportunityFactory.create(
            organization=org,
            opportunity=opportunity,
        )

        _clear_mock_responses()
        task = OrgSavedOpportunityNotificationTask(db_session, self.notification_config)
        task.run()

        assert len(_get_mock_responses()) == 0

    def test_suppressed_email_user_receives_no_email(
        self,
        db_session,
        enable_factory_create,
        user_with_email,
        org_with_user,
        configuration,
    ):
        """Test that users with suppressed emails do not receive notifications."""
        factories.SuppressedEmailFactory.create(email="test@example.com")

        opportunity = factories.OpportunityFactory.create()
        factories.OrganizationSavedOpportunityFactory.create(
            organization=org_with_user,
            opportunity=opportunity,
        )

        _clear_mock_responses()
        task = OrgSavedOpportunityNotificationTask(db_session, self.notification_config)
        task.run()

        assert len(_get_mock_responses()) == 0

    def test_multiple_opportunities_in_one_org_single_email(
        self,
        db_session,
        enable_factory_create,
        user_with_email,
        org_with_user,
        configuration,
    ):
        """Test that multiple new opportunities in one org result in a single email."""
        for _ in range(3):
            opp = factories.OpportunityFactory.create()
            factories.OrganizationSavedOpportunityFactory.create(
                organization=org_with_user,
                opportunity=opp,
            )

        _clear_mock_responses()
        task = OrgSavedOpportunityNotificationTask(db_session, self.notification_config)
        task.run()

        mock_responses = _get_mock_responses()
        assert len(mock_responses) == 1

        notification_logs = (
            db_session.execute(
                select(UserNotificationLog).where(
                    UserNotificationLog.notification_reason
                    == NotificationReason.ORG_SAVED_OPPORTUNITY
                )
            )
            .scalars()
            .all()
        )
        assert len(notification_logs) == 1

    def test_user_in_multiple_orgs_receives_single_email(
        self,
        db_session,
        enable_factory_create,
        user_with_email,
        configuration,
    ):
        """Test that a user in multiple orgs with new opportunities gets one email."""
        org1 = factories.OrganizationFactory.create()
        org2 = factories.OrganizationFactory.create()

        factories.OrganizationUserFactory.create(organization=org1, user=user_with_email)
        factories.OrganizationUserFactory.create(organization=org2, user=user_with_email)

        factories.UserSavedOpportunityNotificationFactory.create(
            user=user_with_email, organization=org1, email_enabled=True
        )
        factories.UserSavedOpportunityNotificationFactory.create(
            user=user_with_email, organization=org2, email_enabled=True
        )

        opp1 = factories.OpportunityFactory.create()
        opp2 = factories.OpportunityFactory.create()
        factories.OrganizationSavedOpportunityFactory.create(organization=org1, opportunity=opp1)
        factories.OrganizationSavedOpportunityFactory.create(organization=org2, opportunity=opp2)

        _clear_mock_responses()
        task = OrgSavedOpportunityNotificationTask(db_session, self.notification_config)
        task.run()

        # One user -> one email containing opportunities from both orgs
        mock_responses = _get_mock_responses()
        assert len(mock_responses) == 1

    def test_one_user_notified_other_not_in_same_org(
        self,
        db_session,
        enable_factory_create,
        user_with_email,
        configuration,
    ):
        """Test that one user with notifications enabled gets email; another without does not."""
        # Second user without notification
        user2 = factories.UserFactory.create()
        factories.LinkExternalUserFactory.create(user=user2, email="other@example.com")

        org = factories.OrganizationFactory.create()

        factories.OrganizationUserFactory.create(organization=org, user=user_with_email)
        factories.OrganizationUserFactory.create(organization=org, user=user2)

        # Only user_with_email has notifications enabled
        factories.UserSavedOpportunityNotificationFactory.create(
            user=user_with_email, organization=org, email_enabled=True
        )
        factories.UserSavedOpportunityNotificationFactory.create(
            user=user2, organization=org, email_enabled=False
        )

        opportunity = factories.OpportunityFactory.create()
        factories.OrganizationSavedOpportunityFactory.create(
            organization=org, opportunity=opportunity
        )

        _clear_mock_responses()
        task = OrgSavedOpportunityNotificationTask(db_session, self.notification_config)
        task.run()

        mock_responses = _get_mock_responses()
        assert len(mock_responses) == 1

        notification_logs = (
            db_session.execute(
                select(UserNotificationLog).where(
                    UserNotificationLog.notification_reason
                    == NotificationReason.ORG_SAVED_OPPORTUNITY
                )
            )
            .scalars()
            .all()
        )
        assert len(notification_logs) == 1
        assert notification_logs[0].user_id == user_with_email.user_id

    def test_no_unprocessed_opportunities_no_email(
        self,
        db_session,
        enable_factory_create,
        user_with_email,
        org_with_user,
        configuration,
    ):
        """Test that no email is sent when there are no unprocessed opportunities."""
        opportunity = factories.OpportunityFactory.create()
        # Create with notification_processed_at already set
        org_saved_opp = factories.OrganizationSavedOpportunityFactory.create(
            organization=org_with_user,
            opportunity=opportunity,
        )
        org_saved_opp.notification_processed_at = datetime_util.utcnow()
        db_session.flush()

        _clear_mock_responses()
        task = OrgSavedOpportunityNotificationTask(db_session, self.notification_config)
        task.run()

        assert len(_get_mock_responses()) == 0

    def test_truncation_more_than_max_opportunities(
        self,
        db_session,
        enable_factory_create,
        user_with_email,
        org_with_user,
        configuration,
    ):
        """Test that opportunities beyond MAX_OPPORTUNITIES_DISPLAYED are truncated in the email."""
        # Create 7 opportunities (more than MAX_OPPORTUNITIES_DISPLAYED = 5)
        for _ in range(7):
            opp = factories.OpportunityFactory.create()
            factories.OrganizationSavedOpportunityFactory.create(
                organization=org_with_user,
                opportunity=opp,
            )

        _clear_mock_responses()
        task = OrgSavedOpportunityNotificationTask(db_session, self.notification_config)
        task.run()

        mock_responses = _get_mock_responses()
        assert len(mock_responses) == 1

        request, _ = mock_responses[0]
        email_html = request["MessageRequest"]["MessageConfiguration"]["EmailMessage"][
            "SimpleEmail"
        ]["HtmlPart"]["Data"]

        # Should show "+ 2 more opportunities" for the 2 truncated items
        assert "+ 2 more opportunities" in email_html

    def test_html_content_includes_opportunity_details(
        self,
        db_session,
        enable_factory_create,
        user_with_email,
        org_with_user,
        configuration,
    ):
        """Test that the email HTML contains the opportunity title and link."""
        opportunity = factories.OpportunityFactory.create(
            opportunity_title="Test Grant Opportunity"
        )
        factories.OrganizationSavedOpportunityFactory.create(
            organization=org_with_user,
            opportunity=opportunity,
        )

        _clear_mock_responses()
        task = OrgSavedOpportunityNotificationTask(db_session, self.notification_config)
        task.run()

        mock_responses = _get_mock_responses()
        assert len(mock_responses) == 1

        request, _ = mock_responses[0]
        email_html = request["MessageRequest"]["MessageConfiguration"]["EmailMessage"][
            "SimpleEmail"
        ]["HtmlPart"]["Data"]

        assert "Test Grant Opportunity" in email_html
        assert f"/opportunity/{opportunity.opportunity_id}" in email_html
        assert "/notifications" in email_html

    def test_notification_processed_at_set_after_run(
        self,
        db_session,
        enable_factory_create,
        user_with_email,
        org_with_user,
        configuration,
    ):
        """Test that notification_processed_at is set on org saved opportunities after task runs."""
        opportunity = factories.OpportunityFactory.create()
        factories.OrganizationSavedOpportunityFactory.create(
            organization=org_with_user,
            opportunity=opportunity,
        )

        _clear_mock_responses()
        task = OrgSavedOpportunityNotificationTask(db_session, self.notification_config)
        task.run()

        db_session.expire_all()
        org_saved_opps = (
            db_session.execute(
                select(OrganizationSavedOpportunity).where(
                    OrganizationSavedOpportunity.organization_id == org_with_user.organization_id
                )
            )
            .scalars()
            .all()
        )
        assert all(opp.notification_processed_at is not None for opp in org_saved_opps)


# ---------------------------------------------------------------------------
# Unit tests for build_notification_content (moved from test_saved_opportunity_notification.py)
# ---------------------------------------------------------------------------


def test_build_notification_content_single_opportunity(monkeypatch, enable_factory_create):
    monkeypatch.setenv("FRONTEND_BASE_URL", "http://localhost:3000")

    from src.task.notifications.config import EmailNotificationConfig
    from src.task.notifications.org_saved_opportunity_notification import build_notification_content
    from tests.src.db.models.factories import (
        OpportunityFactory,
        OrganizationSavedOpportunityFactory,
        SamGovEntityFactory,
    )

    config = EmailNotificationConfig()

    sam_gov = SamGovEntityFactory.create(has_organization=True)
    opp = OpportunityFactory.create(opportunity_title="Research Grant")
    OrganizationSavedOpportunityFactory.create(opportunity=opp, organization=sam_gov.organization)

    subject, html = build_notification_content(
        config=config,
        organization=sam_gov.organization,
        org_saved_opportunities=[opp],
    )

    assert subject == f"{sam_gov.organization.organization_name} has a new opportunity to review"

    expected_html = f"""<html>
<body>

<p>
A new opportunity has been saved for your organization. See what fits your team's goals and align on next steps.
</p>

<ul style="list-style-type:none; margin:0; padding-left:16px;">
<li style="list-style-type:none; margin:0; padding:0;"><a href="http://localhost:3000/opportunity/{opp.opportunity_id}" target="_blank">Research Grant</a></li>
</ul>

<p>
<a href="http://localhost:3000/workspace/saved-opportunities?savedBy=organization:{sam_gov.organization.organization_id}" style="text-decoration: none;">View all opportunities</a>
</p>

<p>
Manage which updates you receive in your
<a href="http://localhost:3000/notifications">notification preferences</a>.
</p>

</body>
</html>"""
    assert html == expected_html


def test_build_notification_content_three_opportunities(monkeypatch, enable_factory_create):
    monkeypatch.setenv("FRONTEND_BASE_URL", "http://localhost:3000")

    from src.task.notifications.config import EmailNotificationConfig
    from src.task.notifications.org_saved_opportunity_notification import build_notification_content
    from tests.src.db.models.factories import (
        OpportunityFactory,
        OrganizationSavedOpportunityFactory,
        SamGovEntityFactory,
    )

    config = EmailNotificationConfig()

    sam_gov = SamGovEntityFactory.create(has_organization=True)
    opps = [
        OpportunityFactory.create(opportunity_title="Opp 1"),
        OpportunityFactory.create(opportunity_title="Opp 2"),
        OpportunityFactory.create(opportunity_title="Opp 3"),
    ]
    for opp in opps:
        OrganizationSavedOpportunityFactory.create(
            opportunity=opp, organization=sam_gov.organization
        )

    subject, html = build_notification_content(
        config=config,
        organization=sam_gov.organization,
        org_saved_opportunities=opps,
    )

    assert subject == f"{sam_gov.organization.organization_name} has new opportunities to review"

    expected_html = f"""<html>
<body>

<p>
New opportunities have been saved for your organization. See what fits your team's goals and align on next steps.
</p>

<ul style="list-style-type:none; margin:0; padding-left:16px;">
<li style="list-style-type:none; margin:0; padding:0;"><a href="http://localhost:3000/opportunity/{opps[0].opportunity_id}" target="_blank">Opp 1</a></li>
<li style="list-style-type:none; margin:0; padding:0;"><a href="http://localhost:3000/opportunity/{opps[1].opportunity_id}" target="_blank">Opp 2</a></li>
<li style="list-style-type:none; margin:0; padding:0;"><a href="http://localhost:3000/opportunity/{opps[2].opportunity_id}" target="_blank">Opp 3</a></li>
</ul>

<p>
<a href="http://localhost:3000/workspace/saved-opportunities?savedBy=organization:{sam_gov.organization.organization_id}" style="text-decoration: none;">View all opportunities</a>
</p>

<p>
Manage which updates you receive in your
<a href="http://localhost:3000/notifications">notification preferences</a>.
</p>

</body>
</html>"""
    assert html == expected_html


def test_build_notification_content_more_than_max_opportunities(monkeypatch, enable_factory_create):
    monkeypatch.setenv("FRONTEND_BASE_URL", "http://localhost:3000")

    from src.task.notifications.config import EmailNotificationConfig
    from src.task.notifications.org_saved_opportunity_notification import build_notification_content
    from tests.src.db.models.factories import (
        OpportunityFactory,
        OrganizationSavedOpportunityFactory,
        SamGovEntityFactory,
    )

    config = EmailNotificationConfig()

    sam_gov = SamGovEntityFactory.create(has_organization=True)
    # 7 opportunities — shows 5 (MAX_OPPORTUNITIES_DISPLAYED), truncates 2
    opps = [OpportunityFactory.create(opportunity_title=f"Opp {i}") for i in range(1, 8)]
    for opp in opps:
        OrganizationSavedOpportunityFactory.create(
            opportunity=opp, organization=sam_gov.organization
        )

    subject, html = build_notification_content(
        config=config,
        organization=sam_gov.organization,
        org_saved_opportunities=opps,
    )

    assert subject == f"{sam_gov.organization.organization_name} has new opportunities to review"

    expected_html = f"""<html>
<body>

<p>
New opportunities have been saved for your organization. See what fits your team's goals and align on next steps.
</p>

<ul style="list-style-type:none; margin:0; padding-left:16px;">
<li style="list-style-type:none; margin:0; padding:0;"><a href="http://localhost:3000/opportunity/{opps[0].opportunity_id}" target="_blank">Opp 1</a></li>
<li style="list-style-type:none; margin:0; padding:0;"><a href="http://localhost:3000/opportunity/{opps[1].opportunity_id}" target="_blank">Opp 2</a></li>
<li style="list-style-type:none; margin:0; padding:0;"><a href="http://localhost:3000/opportunity/{opps[2].opportunity_id}" target="_blank">Opp 3</a></li>
<li style="list-style-type:none; margin:0; padding:0;"><a href="http://localhost:3000/opportunity/{opps[3].opportunity_id}" target="_blank">Opp 4</a></li>
<li style="list-style-type:none; margin:0; padding:0;"><a href="http://localhost:3000/opportunity/{opps[4].opportunity_id}" target="_blank">Opp 5</a></li>
<li style="list-style-type:none; margin:0; padding:0;">+ 2 more opportunities</li>
</ul>

<p>
<a href="http://localhost:3000/workspace/saved-opportunities?savedBy=organization:{sam_gov.organization.organization_id}" style="text-decoration: none;">View all opportunities</a>
</p>

<p>
Manage which updates you receive in your
<a href="http://localhost:3000/notifications">notification preferences</a>.
</p>

</body>
</html>"""
    assert html == expected_html
