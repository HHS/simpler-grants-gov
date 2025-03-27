import os

from pydantic_settings import BaseSettings, SettingsConfigDict

import src

env_file = os.path.join(
    os.path.dirname(os.path.dirname(src.__file__)),
    "config",
    "%s.env" % os.getenv("ENVIRONMENT", "local"),
)


class PydanticBaseEnvConfig(BaseSettings):
    model_config = SettingsConfigDict(env_file=env_file)
