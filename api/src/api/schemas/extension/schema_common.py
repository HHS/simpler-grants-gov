import dataclasses

from src.validation.validation_constants import ValidationErrorType


@dataclasses.dataclass
class MarshmallowErrorContainer:
    key: ValidationErrorType
    message: str
