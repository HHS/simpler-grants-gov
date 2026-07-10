import dataclasses


@dataclasses.dataclass
class MarshmallowErrorContainer:
    key: str
    message: str
