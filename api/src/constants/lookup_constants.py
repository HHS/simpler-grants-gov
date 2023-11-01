from enum import StrEnum


class OpportunityCategory(StrEnum):
    DISCRETIONARY = "D"
    MANDATORY = "M"
    CONTINUATION = "C"
    EARMARK = "E"
    OTHER = "O"
