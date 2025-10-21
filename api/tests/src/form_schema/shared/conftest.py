from src.form_schema.jsonschema_resolver import resolve_jsonschema


def build_schema(shared_schema, field: str):
    return resolve_jsonschema(
        {
            "type": "object",
            "properties": {"my_field": {"allOf": [{"$ref": shared_schema.field_ref(field)}]}},
        }
    )
