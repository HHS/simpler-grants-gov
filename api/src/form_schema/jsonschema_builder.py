from enum import StrEnum
from typing import Any, Self


class JsonSchemaBuilder:
    """Builder class for constructing a JsonSchema object"""

    def __init__(self, schema: str | None = None, id: str | None = None):
        # These represent the $schema and $id values optionally added to a schema
        self.schema = schema
        self.id = id

        self.properties: dict[str, Any] = {}
        self.required_fields: list[str] = []

        self.defs: dict[str, Any] = {}

    def add_string_property(
        self,
        field_name: str,
        is_nullable: bool,
        is_required: bool,
        *,
        min_length: int | None = None,
        max_length: int | None = None,
        pattern: str | None = None,
        format: str | None = None,
        enum: list[str] | type[StrEnum] | None = None
    ) -> Self:
        """
        Add a string property to your JsonSchema
        """
        str_property: dict = {}

        if is_nullable:
            str_property["type"] = ["string", "null"]
        else:
            str_property["type"] = "string"

        if min_length is not None:
            str_property["minLength"] = min_length
        if max_length is not None:
            str_property["maxLength"] = max_length

        if pattern is not None:
            str_property["pattern"] = pattern

        if format is not None:
            str_property["format"] = format

        if enum is not None:
            if isinstance(enum, list):
                str_property["enum"] = enum
            else:
                # StrEnum
                str_property["enum"] = [e.value for e in enum]

        self.properties[field_name] = str_property

        if is_required:
            self.required_fields.append(field_name)

        return self

    def add_bool_property(self, field_name: str, is_nullable: bool, is_required: bool) -> Self:
        """
        Add a bool property to your JsonSchema
        """
        bool_property: dict = {}

        if is_nullable:
            bool_property["type"] = ["boolean", "null"]
        else:
            bool_property["type"] = "boolean"

        self.properties[field_name] = bool_property

        if is_required:
            self.required_fields.append(field_name)

        return self

    def add_int_property(
        self,
        field_name: str,
        is_nullable: bool,
        is_required: bool,
        *,
        minimum: int | None = None,
        maximum: int | None = None,
        exclusive_minimum: int | None = None,
        exclusive_maximum: int | None = None
    ) -> Self:
        """
        Add an int property to your JsonSchema
        """
        int_property: dict = {}

        if is_nullable:
            int_property["type"] = ["integer", "null"]
        else:
            int_property["type"] = "integer"

        if minimum is not None:
            int_property["minimum"] = minimum

        if maximum is not None:
            int_property["maximum"] = maximum

        if exclusive_minimum is not None:
            int_property["exclusiveMinimum"] = exclusive_minimum

        if exclusive_maximum is not None:
            int_property["exclusiveMaximum"] = exclusive_maximum

        self.properties[field_name] = int_property

        if is_required:
            self.required_fields.append(field_name)

        return self

    def add_float_property(
        self,
        field_name: str,
        is_nullable: bool,
        is_required: bool,
        *,
        minimum: int | float | None = None,
        maximum: int | float | None = None,
        exclusive_minimum: int | float | None = None,
        exclusive_maximum: int | float | None = None
    ) -> Self:
        """
        Add a float/number property to your JsonSchema
        """
        float_property: dict = {}

        if is_nullable:
            float_property["type"] = ["number", "null"]
        else:
            float_property["type"] = "number"

        if minimum is not None:
            float_property["minimum"] = minimum

        if maximum is not None:
            float_property["maximum"] = maximum

        if exclusive_minimum is not None:
            float_property["exclusiveMinimum"] = exclusive_minimum

        if exclusive_maximum is not None:
            float_property["exclusiveMaximum"] = exclusive_maximum

        self.properties[field_name] = float_property

        if is_required:
            self.required_fields.append(field_name)

        return self

    def add_sub_object(
        self, field_name: str, is_required: bool, builder: "JsonSchemaBuilder"
    ) -> Self:
        """
        Add an object to your JsonSchema

        Takes in another JsonSchema builder
        """
        if is_required:
            self.required_fields.append(field_name)

        self.properties[field_name] = builder.build()

        return self

    def add_ref_property(self, field_name: str, ref_path: str, is_required: bool) -> Self:
        """
        Add a ref property to your JsonSchema

        Does not validate or in any way verify that the path passed in is valid
        """
        if is_required:
            self.required_fields.append(field_name)

        self.properties[field_name] = {"$ref": ref_path}

        return self

    def add_def_object(self, field_name: str, def_object: dict) -> Self:
        """
        Add an object to the $defs section of JsonSchema
        """
        self.defs[field_name] = def_object

        return self

    def build(self) -> dict:
        """
        Construct your JsonSchema
        """
        json_schema = {
            "type": "object",
            "required": self.required_fields,
            "properties": self.properties,
        }

        if self.schema is not None:
            json_schema["$schema"] = self.schema
        if self.id is not None:
            json_schema["$id"] = self.id

        if self.defs:
            json_schema["$defs"] = self.defs

        return json_schema
