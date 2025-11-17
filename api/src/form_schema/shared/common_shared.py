from src.form_schema.shared.shared_schema import SharedSchema

COMMON_SHARED_JSON_SCHEMA_V1 = {
    "attachment": {"type": "string", "format": "uuid"},
    "person_name": {
        "type": "object",
        "title": "Name and Contact Information",
        "description": "",
        "required": [
            "first_name",
            "last_name",
        ],
        "properties": {
            "prefix": {
                "type": "string",
                "title": "Prefix",
                "description": "Enter the Prefix.",
                "minLength": 1,
                "maxLength": 10,
            },
            "first_name": {
                "type": "string",
                "title": "First Name",
                "description": "Enter the First Name.",
                "minLength": 1,
                "maxLength": 35,
            },
            "middle_name": {
                "type": "string",
                "title": "Middle Name",
                "description": "Enter the Middle Name.",
                "minLength": 1,
                "maxLength": 25,
            },
            "last_name": {
                "type": "string",
                "title": "Last Name",
                "description": "Enter the Last Name.",
                "minLength": 1,
                "maxLength": 60,
            },
            "suffix": {
                "type": "string",
                "title": "Suffix",
                "description": "Enter the Suffix.",
                "minLength": 1,
                "maxLength": 10,
            },
        },
    },
    "budget_monetary_amount": {
        # Represents a monetary amount. We use a string instead of number
        # to avoid any floating point rounding issues.
        "type": "string",
        # Pattern here effectively says:
        # * An optional negative sign
        # * Any number of digits
        # * An optional decimal point
        # * Then exactly 2 digits - if there was a decimal
        "pattern": r"^(-)?\d*([.]\d{2})?$",
        # Limit the max amount based on the length (11-digits, allows up to 99 billion)
        "minLength": 1,
        "maxLength": 14,
    },
    "phone_number": {
        "type": "string",
        "minLength": 1,
        "maxLength": 25,
    },
    "contact_person_title": {
        "type": "string",
        "title": "Title",
        "description": "Enter the position title.",
        "minLength": 1,
        "maxLength": 45,
    },
    "signature": {
        "type": "string",
        "title": "Signature",
        "description": "Completed by Grants.gov upon submission.",
        "minLength": 1,
        "maxLength": 144,
    },
    "submitted_date": {
        "type": "string",
        "format": "date",
        "title": "Submitted Date",
        "description": "Completed by Grants.gov upon submission.",
    },
    # This mirrors the "globLib:OrganizationNameDataType" from grants.gov
    # Which is used for applicant / organization name and represents who is applying
    "organization_name": {
        "type": "string",
        "title": "Organization Name",
        "minLength": 1,
        "maxLength": 60,
    },
}


COMMON_SHARED_V1 = SharedSchema(
    schema_name="common_shared_v1", json_schema=COMMON_SHARED_JSON_SCHEMA_V1
)
