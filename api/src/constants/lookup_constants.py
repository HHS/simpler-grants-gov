from enum import StrEnum

from src.db.models.lookup import LookupConfig, LookupStr


class OpportunityCategory(StrEnum):
    # TODO - change these to full text once we build the next version of the API
    DISCRETIONARY = "D"
    MANDATORY = "M"
    CONTINUATION = "C"
    EARMARK = "E"
    OTHER = "O"


OPPORTUNITY_CATEGORY_CONFIG = LookupConfig(
    [
        LookupStr(OpportunityCategory.DISCRETIONARY, 1),
        LookupStr(OpportunityCategory.MANDATORY, 2),
        LookupStr(OpportunityCategory.CONTINUATION, 3),
        LookupStr(OpportunityCategory.EARMARK, 4),
        LookupStr(OpportunityCategory.OTHER, 5),
    ]
)
