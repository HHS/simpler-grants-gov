from src.form_schema.shared import shared_form_constants
from src.form_schema.shared.shared_schema import SharedSchema

ADDRESS_SHARED_JSON_SCHEMA_V1 = {
    # An address containing core fields, as well as country, county, and province
    "address": {
        "type": "object",
        "title": "Address",
        "description": "Enter an address.",
        "required": [
            "street1",
            "city",
            "country",
        ],
        # Conditional validation rules for an address field
        "allOf": [
            # If country is United States, state and zip_code are required
            {
                "if": {
                    "properties": {"country": {"const": "USA: UNITED STATES"}},
                    "required": ["country"],  # Only run rule if country is set
                },
                "then": {"required": ["state", "zip_code"]},
            },
        ],
        "properties": {
            "street1": {"$ref": "#/street1"},
            "street2": {"$ref": "#/street2"},
            "city": {"$ref": "#/city"},
            "county": {
                "type": "string",
                "title": "County/Parish",
                "description": "Enter the County/Parish.",
                "minLength": 1,
                "maxLength": 30,
            },
            "state": {"$ref": "#/state"},
            "province": {
                "type": "string",
                "title": "Province",
                "description": "Enter the province.",
                "minLength": 1,
                "maxLength": 30,
                # Note that grants.gov would hide this if the country isn't USA, but it isn't required even then
            },
            "country": {
                "allOf": [{"$ref": "#/country_code"}],
                "title": "Country",
                "description": "Enter the country.",
            },
            "zip_code": {"$ref": "#/zip_code"},
        },
    },
    # An address containing the core address fields
    "simple_address": {
        "type": "object",
        "title": "Address",
        "description": "Enter an address.",
        "required": [
            "street1",
            "city",
        ],
        "properties": {
            "street1": {"$ref": "#/street1"},
            "street2": {"$ref": "#/street2"},
            "city": {"$ref": "#/city"},
            "state": {"$ref": "#/state"},
            "zip_code": {"$ref": "#/zip_code"},
        },
    },
    # TODO - test
    "simple_address_with_country": {
        "type": "object",
        "title": "Address",
        "description": "Enter an address.",
        "required": [
            "street1",
            "city",
            "country"
        ],
        "allOf": [
            # If country is United States, state and zip_code are required
            {
                "if": {
                    "properties": {"country": {"const": "USA: UNITED STATES"}},
                    "required": ["country"],  # Only run rule if country is set
                },
                "then": {"required": ["state", "zip_code"]},
            },
        ],
        "properties": {
            "street1": {"$ref": "#/street1"},
            "street2": {"$ref": "#/street2"},
            "city": {"$ref": "#/city"},
            "state": {"$ref": "#/state"},
            "zip_code": {"$ref": "#/zip_code"},
            "country": {"$ref": "#/country_code"},
        },
    },
    "street1": {
        "type": "string",
        "title": "Street 1",
        "description": "Enter the first line of the Street Address.",
        "minLength": 1,
        "maxLength": 55,
    },
    "street2": {
        "type": "string",
        "title": "Street 2",
        "description": "Enter the second line of the Street Address.",
        "minLength": 1,
        "maxLength": 55,
    },
    "city": {
        "type": "string",
        "title": "City",
        "description": "Enter the city.",
        "minLength": 1,
        "maxLength": 35,
    },
    "state": {
        "allOf": [{"$ref": "#/state_code"}],
        "title": "State",
        "description": "Enter the state.",
    },
    "zip_code": {
        "type": "string",
        "title": "Zip / Postal Code",
        "description": "Enter the nine-digit Postal Code (e.g., ZIP code).",
        "minLength": 1,
        "maxLength": 30,
    },
    "state_code": {
        "type": "string",
        "title": "State",
        "description": "US State or Territory Code",
        "enum": shared_form_constants.STATES,
    },
    "country_code": {
        "type": "string",
        "title": "Country",
        "description": "Country Code",
        "enum": shared_form_constants.COUNTRIES,
    },
}

ADDRESS_SHARED_V1 = SharedSchema(
    schema_name="address_shared_v1", json_schema=ADDRESS_SHARED_JSON_SCHEMA_V1
)
