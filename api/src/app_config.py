from src.util.env_config import PydanticBaseEnvConfig


class AppConfig(PydanticBaseEnvConfig):
    environment: str = "prod"

    # Set HOST to 127.0.0.1 by default to avoid other machines on the network
    # from accessing the application. This is especially important if you are
    # running the application locally on a public network. This needs to be
    # overriden to 0.0.0.0 when running in a container
    # See https://flask.palletsprojects.com/en/2.2.x/api/#flask.Flask.run
    host: str = "127.0.0.1"
    port: int = 8080
