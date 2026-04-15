from src.task.notifications.config import EmailNotificationConfig
from src.task.notifications.saved_opportunity_notification import build_notification_content
from tests.src.db.models.factories import (
    OpportunityFactory,
    OrganizationSavedOpportunityFactory,
    SamGovEntityFactory,
)


def test_build_notification_content_single_opportunity(monkeypatch, enable_factory_create):
    monkeypatch.setenv("FRONTEND_BASE_URL", "http://localhost:3000")

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

    expected_html = f"""
<html>
<body>

<p>
A new opportunity has been saved for your organization. See what fits your team’s goals and align on next steps.
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
</html>
""".strip()

    assert html == expected_html


def test_build_notification_content_three_opportunities(monkeypatch, enable_factory_create):
    monkeypatch.setenv("FRONTEND_BASE_URL", "http://localhost:3000")

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

    expected_html = f"""
<html>
<body>

<p>
New opportunities have been saved for your organization. See what fits your team’s goals and align on next steps.
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
</html>
""".strip()

    assert html == expected_html


def test_build_notification_content_more_than_three_opportunities(
    monkeypatch, enable_factory_create
):
    monkeypatch.setenv("FRONTEND_BASE_URL", "http://localhost:3000")

    config = EmailNotificationConfig()

    sam_gov = SamGovEntityFactory.create(has_organization=True)

    opps = [
        OpportunityFactory.create(opportunity_title="Opp 1"),
        OpportunityFactory.create(opportunity_title="Opp 2"),
        OpportunityFactory.create(opportunity_title="Opp 3"),
        OpportunityFactory.create(opportunity_title="Opp 4"),
        OpportunityFactory.create(opportunity_title="Opp 5"),
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

    expected_html = f"""
<html>
<body>

<p>
New opportunities have been saved for your organization. See what fits your team’s goals and align on next steps.
</p>

<ul style="list-style-type:none; margin:0; padding-left:16px;">
<li style="list-style-type:none; margin:0; padding:0;"><a href="http://localhost:3000/opportunity/{opps[0].opportunity_id}" target="_blank">Opp 1</a></li>
<li style="list-style-type:none; margin:0; padding:0;"><a href="http://localhost:3000/opportunity/{opps[1].opportunity_id}" target="_blank">Opp 2</a></li>
<li style="list-style-type:none; margin:0; padding:0;"><a href="http://localhost:3000/opportunity/{opps[2].opportunity_id}" target="_blank">Opp 3</a></li>
<li style="list-style-type:none; margin:0; padding:0;">+ 2 more</li>
</ul>

<p>
<a href="http://localhost:3000/workspace/saved-opportunities?savedBy=organization:{sam_gov.organization.organization_id}" style="text-decoration: none;">View all opportunities</a>
</p>

<p>
Manage which updates you receive in your
<a href="http://localhost:3000/notifications">notification preferences</a>.
</p>

</body>
</html>
""".strip()
    assert html == expected_html
