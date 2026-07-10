import uuid

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form
from src.form_schema.shared import ADDRESS_SHARED_V1, COMMON_SHARED_V1

FORM_JSON_SCHEMA = {
    "type": "object",
    # The applicant organization and at least one key contact are required,
    # matching the legacy XSD (ApplicantOrganizationName + RoleOnProject minOccurs=1).
    "required": ["applicant_organization_name", "key_contacts"],
    "properties": {
        "applicant_organization_name": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("organization_name")}],
            "title": "Applicant Organization Name",
            "description": "Enter the name of the applicant organization.",
        },
        "key_contacts": {
            "type": "array",
            "title": "Key Contacts",
            "description": "Enter between 1 and 4 key contacts and their role on the project.",
            # XSD RoleOnProject: minOccurs defaults to 1, maxOccurs=4
            "minItems": 1,
            "maxItems": 4,
            "items": {"$ref": "#/$defs/key_contact_person"},
        },
    },
    "$defs": {
        "key_contact_person": {
            "type": "object",
            "required": ["project_role", "name", "address", "phone", "email"],
            "properties": {
                "project_role": {
                    "type": "string",
                    "title": "Project Role",
                    "description": "Enter the contact's role on the project.",
                    "minLength": 1,
                    "maxLength": 45,
                },
                "name": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("person_name")}],
                    "title": "Name",
                },
                "title": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("contact_person_title")}],
                    "title": "Title",
                },
                "organizational_affiliation": {
                    "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("organization_name")}],
                    "title": "Organizational Affiliation",
                    "description": "Enter the contact's organizational affiliation.",
                },
                "address": {
                    # Use the full address (with county/province) per the epic:
                    # the Province field is shown at all times on this form.
                    "allOf": [{"$ref": ADDRESS_SHARED_V1.field_ref("address")}],
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
        "label": "Key Contacts",
        "name": "key_contacts",
        "description": "Enter between 1 and 4 key contacts and their role on the project.",
        "children": [
            # Applicant Organization Name is the first field and is not part of the FieldList.
            {
                "type": "field",
                "definition": "/properties/applicant_organization_name",
            },
            {
                "type": "fieldList",
                "name": "key_contacts",
                "label": "Key Contact",
                "description": "Enter between 1 and 4 key contacts and their role on the project.",
                "children": [
                    {
                        "type": "field",
                        "definition": "/properties/key_contacts/items/properties/project_role",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/key_contacts/items/properties/name/properties/prefix",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/key_contacts/items/properties/name/properties/first_name",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/key_contacts/items/properties/name/properties/middle_name",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/key_contacts/items/properties/name/properties/last_name",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/key_contacts/items/properties/name/properties/suffix",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/key_contacts/items/properties/title",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/key_contacts/items/properties/organizational_affiliation",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/key_contacts/items/properties/address/properties/street1",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/key_contacts/items/properties/address/properties/street2",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/key_contacts/items/properties/address/properties/city",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/key_contacts/items/properties/address/properties/county",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/key_contacts/items/properties/address/properties/state",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/key_contacts/items/properties/address/properties/province",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/key_contacts/items/properties/address/properties/zip_code",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/key_contacts/items/properties/address/properties/country",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/key_contacts/items/properties/phone",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/key_contacts/items/properties/fax",
                    },
                    {
                        "type": "field",
                        "definition": "/properties/key_contacts/items/properties/email",
                    },
                ],
            },
        ],
    },
]


def _key_contact_xml_fields() -> dict:
    """XML field mappings for a single RoleOnProject entry.

    The RoleOnProject element and its direct children belong to the form
    namespace (default), while the contents of the HumanNameDataType and
    AddressDataTypeV3 types come from the GlobalLibrary namespace.
    """
    return {
        "project_role": {
            "xml_transform": {
                "target": "ContactProjectRole",
            }
        },
        "name": {
            "xml_transform": {
                "target": "ContactName",
                "type": "nested_object",
            },
            "prefix": {
                "xml_transform": {
                    "target": "PrefixName",
                    "namespace": "globLib",
                }
            },
            "first_name": {
                "xml_transform": {
                    "target": "FirstName",
                    "namespace": "globLib",
                }
            },
            "middle_name": {
                "xml_transform": {
                    "target": "MiddleName",
                    "namespace": "globLib",
                }
            },
            "last_name": {
                "xml_transform": {
                    "target": "LastName",
                    "namespace": "globLib",
                }
            },
            "suffix": {
                "xml_transform": {
                    "target": "SuffixName",
                    "namespace": "globLib",
                }
            },
        },
        "title": {
            "xml_transform": {
                "target": "ContactTitle",
            }
        },
        "organizational_affiliation": {
            "xml_transform": {
                "target": "ContactOrganizationalAffiliation",
            }
        },
        "address": {
            "xml_transform": {
                "target": "ContactAddress",
                "type": "nested_object",
            },
            # Order matches AddressDataTypeV3 XSD sequence: Street1, Street2, City,
            # County, State|Province, ZipPostalCode, Country
            "street1": {
                "xml_transform": {
                    "target": "Street1",
                    "namespace": "globLib",
                }
            },
            "street2": {
                "xml_transform": {
                    "target": "Street2",
                    "namespace": "globLib",
                }
            },
            "city": {
                "xml_transform": {
                    "target": "City",
                    "namespace": "globLib",
                }
            },
            "county": {
                "xml_transform": {
                    "target": "County",
                    "namespace": "globLib",
                }
            },
            "state": {
                "xml_transform": {
                    "target": "State",
                    "namespace": "globLib",
                }
            },
            "province": {
                "xml_transform": {
                    "target": "Province",
                    "namespace": "globLib",
                }
            },
            "zip_code": {
                "xml_transform": {
                    "target": "ZipPostalCode",
                    "namespace": "globLib",
                }
            },
            "country": {
                "xml_transform": {
                    "target": "Country",
                    "namespace": "globLib",
                }
            },
        },
        "phone": {
            "xml_transform": {
                "target": "ContactPhone",
            }
        },
        "fax": {
            "xml_transform": {
                "target": "ContactFax",
            }
        },
        "email": {
            "xml_transform": {
                "target": "ContactEmail",
            }
        },
    }


# XML Transformation Rules for Key Contacts v2.0
FORM_XML_TRANSFORM_RULES = {
    "_xml_config": {
        "description": "XML transformation rules for Key Contacts form",
        "version": "1.0",
        "form_name": "Key_Contacts_2_0",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/Key_Contacts_2_0-V2.0",
            "Key_Contacts_2_0": "http://apply.grants.gov/forms/Key_Contacts_2_0-V2.0",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
            "codes": "http://apply.grants.gov/system/UniversalCodes-V2.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/Key_Contacts_2_0-V2.0.xsd",
        "xml_structure": {
            "root_element": "Key_Contacts_2_0",
            "root_namespace_prefix": "Key_Contacts_2_0",
            "root_attributes": {
                "FormVersion": "2.0",
            },
        },
        "null_handling_options": {
            "exclude": "Default - exclude field entirely from XML (recommended)",
        },
    },
    # Field mappings - order matches XSD sequence
    "applicant_organization_name": {
        "xml_transform": {
            "target": "ApplicantOrganizationName",
        }
    },
    "key_contacts": {
        "xml_transform": {
            "target": "RoleOnProject",
            "type": "array",
        },
        "items": _key_contact_xml_fields(),
    },
}

KeyContacts_v2_0 = Form(
    # https://www.grants.gov/forms/form-items-description/fid/683
    form_id=uuid.UUID("f140c7db-724d-4954-bebd-081c0527908c"),
    legacy_form_id=683,
    form_name="KEY CONTACTS",
    short_form_name="Key_Contacts",
    form_version="2.0",
    agency_code="SGG",
    omb_number="4040-0010",
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    # No rule schema needed — no conditional fields, attachments, or pre/post-population
    form_rule_schema=None,
    json_to_xml_schema=FORM_XML_TRANSFORM_RULES,
    form_instruction_id=None,
    form_type=FormType.KEY_CONTACTS,
    sgg_version="1.0",
    is_deprecated=False,
)
