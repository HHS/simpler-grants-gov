from .address_shared import ADDRESS_SHARED_V1
from .common_shared import COMMON_SHARED_V1
from .shared_schema import SharedSchema


def get_shared_schemas() -> list[SharedSchema]:
    return [ADDRESS_SHARED_V1, COMMON_SHARED_V1]
