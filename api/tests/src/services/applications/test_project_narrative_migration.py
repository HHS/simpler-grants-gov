"""Exercise both Project Narrative forms through the same attachment consumers."""

import pytest
from sqlalchemy import select

from src.constants.lookup_constants import ApplicationAuditEvent, ApplicationFormStatus, Privilege
from src.db.models.competition_models import ApplicationAudit
from src.form_schema.forms import ProjectNarrativeAttachment_v1_2, ProjectNarrativeGenerated_v1_2
from tests.lib.application_test_utils import create_user_in_app
from tests.src.db.models.factories import (
    ApplicationAttachmentFactory,
    ApplicationFormFactory,
    CompetitionFormFactory,
)


@pytest.fixture(
    params=[
        pytest.param(ProjectNarrativeAttachment_v1_2, id="handwritten"),
        pytest.param(ProjectNarrativeGenerated_v1_2, id="generated"),
    ]
)
def narrative_form(request):
    return request.param


def test_attachment_save_remove_and_audit(
    client, enable_factory_create, seed_form_registry, db_session, narrative_form, s3_config
):
    user, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    cf = CompetitionFormFactory.create(competition=application.competition, form=narrative_form)
    af = ApplicationFormFactory.create(
        application=application, competition_form=cf, application_response={}
    )
    attachment = ApplicationAttachmentFactory.create(application=application, user=user)
    attachment_id = str(attachment.application_attachment_id)
    url = f"/alpha/applications/{application.application_id}/forms/{narrative_form.form_id}"
    response = client.put(
        url,
        headers={"X-SGG-Token": token},
        json={"application_response": {"attachments": [attachment_id]}},
    )
    assert response.status_code == 200
    assert response.json["warnings"] == []
    assert response.json["data"]["application_form_status"] == ApplicationFormStatus.COMPLETE
    db_session.refresh(af)
    assert af.application_response == {"attachments": [attachment_id]}
    audits = db_session.scalars(
        select(ApplicationAudit).where(
            ApplicationAudit.target_attachment_id == attachment.application_attachment_id
        )
    ).all()
    assert [audit.application_audit_event for audit in audits] == [
        ApplicationAuditEvent.ATTACHMENT_ADDED
    ]

    response = client.put(
        url, headers={"X-SGG-Token": token}, json={"application_response": {"attachments": []}}
    )
    assert response.status_code == 200
    db_session.refresh(attachment)
    assert attachment.is_deleted
    assert attachment.file_location == "DELETED"
    audits = db_session.scalars(
        select(ApplicationAudit).where(
            ApplicationAudit.target_attachment_id == attachment.application_attachment_id
        )
    ).all()
    assert {audit.application_audit_event for audit in audits} == {
        ApplicationAuditEvent.ATTACHMENT_ADDED,
        ApplicationAuditEvent.ATTACHMENT_DELETED,
    }


def test_foreign_attachment_cannot_complete_form(
    client, enable_factory_create, seed_form_registry, db_session, narrative_form
):
    _, application, token = create_user_in_app(
        db_session, privileges=[Privilege.MODIFY_APPLICATION]
    )
    cf = CompetitionFormFactory.create(competition=application.competition, form=narrative_form)
    ApplicationFormFactory.create(
        application=application, competition_form=cf, application_response={}
    )
    foreign = ApplicationAttachmentFactory.create()
    response = client.put(
        f"/alpha/applications/{application.application_id}/forms/{narrative_form.form_id}",
        headers={"X-SGG-Token": token},
        json={"application_response": {"attachments": [str(foreign.application_attachment_id)]}},
    )
    assert response.status_code == 200
    assert response.json["data"]["application_form_status"] == ApplicationFormStatus.IN_PROGRESS
    assert len(response.json["warnings"]) == 1
    assert response.json["warnings"][0]["type"] == "unknown_application_attachment"
    assert response.json["warnings"][0]["field"] == "$.attachments[0]"
    db_session.refresh(foreign)
    assert not foreign.is_deleted
