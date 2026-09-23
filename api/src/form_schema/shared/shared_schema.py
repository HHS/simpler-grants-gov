import dataclasses
from typing import Any

import src.util.file_util as file_util
from src.util.env_config import PydanticBaseEnvConfig


class SharedSchemaConfig(PydanticBaseEnvConfig):
    shared_schema_base_uri: str = "https://files.simpler.grants.gov/schemas"


shared_schema_config: SharedSchemaConfig | None = None


def get_shared_schema_config() -> SharedSchemaConfig:
    global shared_schema_config
    if shared_schema_config is None:
        shared_schema_config = SharedSchemaConfig()

    return shared_schema_config


@dataclasses.dataclass
class SharedSchema:
    schema_name: str

    json_schema: dict[str, Any]

    schema_uri: str = dataclasses.field(init=False)

    def __post_init__(self) -> None:
        # Setup the schema URI
        config = get_shared_schema_config()
        self.schema_uri = file_util.join(config.shared_schema_base_uri, self.schema_name + ".json")

    def field_ref(self, field: str) -> str:
        """Build the field ref for a json schema to refer to a field in this shared schema.

        For example, if you wanted to refer to field "example_field" in this shared schema,
        this would return something like:

             https://files.simpler.grants.gov/schemas/my-example-schema.json#/example_field
        """
        return f"{self.schema_uri}#/{field}"
