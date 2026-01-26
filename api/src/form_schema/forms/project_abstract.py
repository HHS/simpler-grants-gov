import uuid

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form
from src.form_schema.shared import COMMON_SHARED_V1

DIRECTIONS = (
    "The Project Abstract must not exceed one page and must contain a "
    "summary of the proposed activity suitable for dissemination to the"
    " public. It should be a self-contained description of the project"
    " and should contain a statement of objectives and methods to be employed."
    " It should be informative to other persons working in the same or related"
    " fields and insofar as possible understandable to a technically literate"
    " lay reader. This Abstract must not include any proprietary/confidential information."
)

FORM_JSON_SCHEMA = {
    "type": "object",
    "required": ["attachment"],
    "properties": {
        "attachment": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
            "title": "Project Abstract File",
            "description": "A file must be attached.",
        }
    },
}

FORM_UI_SCHEMA = [
    {
        "type": "section",
        "label": "Directions",
        "name": "directions",
        "description": DIRECTIONS,
        "children": [],
    },
    {
        "type": "section",
        "label": "Project Abstract File",
        "name": "projectAbstract",
        "children": [
            {"type": "field", "definition": "/properties/attachment", "widget": "Attachment"},
        ],
    },
]

FORM_RULE_SCHEMA = {
    ##### VALIDATION RULES
    "attachment": {"gg_validation": {"rule": "attachment"}},
}

# XML Transformation Rules for Project Abstract v1.2
# XSD: https://apply07.grants.gov/apply/forms/schemas/Project_Abstract_1_2-V1.2.xsd
FORM_XML_TRANSFORM_RULES = {
    # Metadata
    "_xml_config": {
        "description": "XML transformation rules for Project Abstract form",
        "version": "1.0",
        "form_name": "Project_Abstract_1_2",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/Project_Abstract_1_2-V1.2",
            "att": "http://apply.grants.gov/system/Attachments-V1.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
            "glob": "http://apply.grants.gov/system/Global-V1.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/Project_Abstract_1_2-V1.2.xsd",
        "xml_structure": {
            "root_element": "Project_Abstract_1_2",
            "root_attributes": {
                "FormVersion": "1.2",
            },
        },
        "null_handling_options": {
            "exclude": "Default - exclude field entirely from XML (recommended)",
        },
        "attachment_fields": {
            "attachment": {
                "xml_element": "ProjectAbstractAddAttachment",
                "type": "single",
            },
        },
    },
    # No explicit field mapping needed - attachments are handled automatically via attachment_fields config
}

ProjectAbstract_v1_2 = Form(
    # https://grants.gov/forms/form-items-description/fid/541
    form_id=uuid.UUID("b09ac657-f629-431e-a7ba-3f3017a8a466"),
    legacy_form_id=541,
    form_name="Project Abstract",
    short_form_name="Project_Abstract",
    form_version="1.2",
    agency_code="SGG",
    omb_number="4040-0010",
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    json_to_xml_schema=FORM_XML_TRANSFORM_RULES,
    form_instruction_id=uuid.UUID("116b3ef7-d2bb-430c-860b-3277164dea7b"),
    form_type=FormType.PROJECT_ABSTRACT,
    sgg_version="1.0",
    is_deprecated=False,
)
