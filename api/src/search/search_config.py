from pydantic import Field

from src.util.env_config import PydanticBaseEnvConfig


class SearchConfig(PydanticBaseEnvConfig):
    opportunity_search_index_alias: str = Field(default="opportunity-index-alias")


_search_config: SearchConfig | None = None


def get_search_config() -> SearchConfig:
    global _search_config

    if _search_config is None:
        _search_config = SearchConfig()

    return _search_config
