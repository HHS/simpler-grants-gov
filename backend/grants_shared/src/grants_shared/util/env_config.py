import os

from pydantic_settings import BaseSettings, SettingsConfigDict

import grants_shared

# TODO - this wouldn't make sense when used as a package - fix?
env_file = os.path.join(
    os.path.dirname(os.path.dirname(grants_shared.__file__)),
    "config",
    "%s.env" % os.getenv("ENVIRONMENT", "local"),
)


class PydanticBaseEnvConfig(BaseSettings):
    model_config = SettingsConfigDict(env_file=env_file)
