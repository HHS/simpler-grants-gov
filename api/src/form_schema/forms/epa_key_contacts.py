import uuid

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form
from src.form_schema.shared import ADDRESS_SHARED_V1, COMMON_SHARED_V1

FORM_JSON_SCHEMA = {
    "type": "object",
    # Nothing is required at the top level, but
    # if they start a contact, the objects have
    # their own nested required fields.
    "required": [],
    "properties": {
        "authorized_representative": {"$ref": "#/$defs/key_contact_person"},
        "payee": {"$ref": "#/$defs/key_contact_person"},
        "administrative_contact": {"$ref": "#/$defs/key_contact_person"},
        "project_manager": {"$ref": "#/$defs/key_contact_person"},
    },
    "$defs": {
        "key_contact_person": {
            "type": "object",
            "required": ["name", "address", "phone"],
            "properties": {
                "name": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("person_name")}],
                    "title": "Name",
                },
                "title": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("contact_person_title")}],
                    "title": "Title",
                },
                "address": {
                    "allOf": [{"$ref": ADDRESS_SHARED_V1.field_ref("simple_address_with_country")}],
                },
                "phone": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("phone_number")}],
                    "title": "Phone Number",
                },
                "fax": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("phone_number")}],
                    "title": "Fax Number",
                },
                "email": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("contact_email")}],
                    "title": "E-mail Address",
                },
            },
        }
    },
}

FORM_UI_SCHEMA = [
    {
        "type": "section",
        "label": "Authorized Representative",
        "description": "Original awards and amendments will be sent to this individual for review and acceptance, unless otherwise indicated.",
        "name": "authorized_representative",
        "children": [
            {
                "type": "field",
                "definition": "/properties/authorized_representative/properties/name/properties/prefix",
            },
            {
                "type": "field",
                "definition": "/properties/authorized_representative/properties/name/properties/first_name",
            },
            {
                "type": "field",
                "definition": "/properties/authorized_representative/properties/name/properties/middle_name",
            },
            {
                "type": "field",
                "definition": "/properties/authorized_representative/properties/name/properties/last_name",
            },
            {
                "type": "field",
                "definition": "/properties/authorized_representative/properties/name/properties/suffix",
            },
            {
                "type": "field",
                "definition": "/properties/authorized_representative/properties/title",
            },
            {
                "type": "field",
                "definition": "/properties/authorized_representative/properties/address/properties/street1",
            },
            {
                "type": "field",
                "definition": "/properties/authorized_representative/properties/address/properties/street2",
            },
            {
                "type": "field",
                "definition": "/properties/authorized_representative/properties/address/properties/city",
            },
            {
                "type": "field",
                "definition": "/properties/authorized_representative/properties/address/properties/state",
            },
            {
                "type": "field",
                "definition": "/properties/authorized_representative/properties/address/properties/zip_code",
            },
            {
                "type": "field",
                "definition": "/properties/authorized_representative/properties/address/properties/country",
            },
            {
                "type": "field",
                "definition": "/properties/authorized_representative/properties/phone",
            },
            {"type": "field", "definition": "/properties/authorized_representative/properties/fax"},
            {
                "type": "field",
                "definition": "/properties/authorized_representative/properties/email",
            },
        ],
    },
    {
        "type": "section",
        "label": "Payee",
        "description": "Individual authorized to accept payments",
        "name": "payee",
        "children": [
            {"type": "field", "definition": "/properties/payee/properties/name/properties/prefix"},
            {
                "type": "field",
                "definition": "/properties/payee/properties/name/properties/first_name",
            },
            {
                "type": "field",
                "definition": "/properties/payee/properties/name/properties/middle_name",
            },
            {
                "type": "field",
                "definition": "/properties/payee/properties/name/properties/last_name",
            },
            {"type": "field", "definition": "/properties/payee/properties/name/properties/suffix"},
            {"type": "field", "definition": "/properties/payee/properties/title"},
            {
                "type": "field",
                "definition": "/properties/payee/properties/address/properties/street1",
            },
            {
                "type": "field",
                "definition": "/properties/payee/properties/address/properties/street2",
            },
            {"type": "field", "definition": "/properties/payee/properties/address/properties/city"},
            {
                "type": "field",
                "definition": "/properties/payee/properties/address/properties/state",
            },
            {
                "type": "field",
                "definition": "/properties/payee/properties/address/properties/zip_code",
            },
            {
                "type": "field",
                "definition": "/properties/payee/properties/address/properties/country",
            },
            {"type": "field", "definition": "/properties/payee/properties/phone"},
            {"type": "field", "definition": "/properties/payee/properties/fax"},
            {"type": "field", "definition": "/properties/payee/properties/email"},
        ],
    },
    {
        "type": "section",
        "label": "Administrative Contact",
        "description": "Individual from Sponsored Programs Office to contact concerning administrative matters (i.e., indirect cost computation, rebudgeting requests etc).",
        "name": "administrative_contact",
        "children": [
            {
                "type": "field",
                "definition": "/properties/administrative_contact/properties/name/properties/prefix",
            },
            {
                "type": "field",
                "definition": "/properties/administrative_contact/properties/name/properties/first_name",
            },
            {
                "type": "field",
                "definition": "/properties/administrative_contact/properties/name/properties/middle_name",
            },
            {
                "type": "field",
                "definition": "/properties/administrative_contact/properties/name/properties/last_name",
            },
            {
                "type": "field",
                "definition": "/properties/administrative_contact/properties/name/properties/suffix",
            },
            {"type": "field", "definition": "/properties/administrative_contact/properties/title"},
            {
                "type": "field",
                "definition": "/properties/administrative_contact/properties/address/properties/street1",
            },
            {
                "type": "field",
                "definition": "/properties/administrative_contact/properties/address/properties/street2",
            },
            {
                "type": "field",
                "definition": "/properties/administrative_contact/properties/address/properties/city",
            },
            {
                "type": "field",
                "definition": "/properties/administrative_contact/properties/address/properties/state",
            },
            {
                "type": "field",
                "definition": "/properties/administrative_contact/properties/address/properties/zip_code",
            },
            {
                "type": "field",
                "definition": "/properties/administrative_contact/properties/address/properties/country",
            },
            {"type": "field", "definition": "/properties/administrative_contact/properties/phone"},
            {"type": "field", "definition": "/properties/administrative_contact/properties/fax"},
            {"type": "field", "definition": "/properties/administrative_contact/properties/email"},
        ],
    },
    {
        "type": "section",
        "label": "Project Manager",
        "description": "Individual responsible for the technical completion of the proposed work.",
        "name": "project_manager",
        "children": [
            {
                "type": "field",
                "definition": "/properties/project_manager/properties/name/properties/prefix",
            },
            {
                "type": "field",
                "definition": "/properties/project_manager/properties/name/properties/first_name",
            },
            {
                "type": "field",
                "definition": "/properties/project_manager/properties/name/properties/middle_name",
            },
            {
                "type": "field",
                "definition": "/properties/project_manager/properties/name/properties/last_name",
            },
            {
                "type": "field",
                "definition": "/properties/project_manager/properties/name/properties/suffix",
            },
            {"type": "field", "definition": "/properties/project_manager/properties/title"},
            {
                "type": "field",
                "definition": "/properties/project_manager/properties/address/properties/street1",
            },
            {
                "type": "field",
                "definition": "/properties/project_manager/properties/address/properties/street2",
            },
            {
                "type": "field",
                "definition": "/properties/project_manager/properties/address/properties/city",
            },
            {
                "type": "field",
                "definition": "/properties/project_manager/properties/address/properties/state",
            },
            {
                "type": "field",
                "definition": "/properties/project_manager/properties/address/properties/zip_code",
            },
            {
                "type": "field",
                "definition": "/properties/project_manager/properties/address/properties/country",
            },
            {"type": "field", "definition": "/properties/project_manager/properties/phone"},
            {"type": "field", "definition": "/properties/project_manager/properties/fax"},
            {"type": "field", "definition": "/properties/project_manager/properties/email"},
        ],
    },
]

EPA_KEY_CONTACT_v2_0 = Form(
    # https://www.grants.gov/forms/form-items-description/fid/674
    form_id=uuid.UUID("3c4d17c7-e10e-4087-b8ab-a5c1930d4221"),
    legacy_form_id=674,
    form_name="EPA KEY CONTACTS FORM",
    short_form_name="EPA_KeyContacts",
    form_version="2.0",
    agency_code="SGG",
    omb_number="2030-0020",
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    # No rule schema needed
    form_rule_schema=None,
    # No form instructions
    form_type=FormType.EPA_KEY_CONTACTS,
    sgg_version="1.0",
    is_deprecated=False,
)
