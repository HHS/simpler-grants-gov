import os

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

import src

env_file = os.path.join(
    os.path.dirname(os.path.dirname(src.__file__)),
    "config",
    "%s.env" % os.getenv("ENVIRONMENT", "local"),
)


class PydanticBaseEnvConfig(BaseSettings):
    model_config = SettingsConfigDict(env_file=env_file)
    environment: str = Field(alias="ENVIRONMENT")

    @property
    def is_prod(self) -> bool:
        print(self.environment)
        return self.environment == "prod"
