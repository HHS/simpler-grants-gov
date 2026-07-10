from dataclasses import dataclass
from decimal import Decimal


@dataclass
class AwardRecommendationSummaryData:
    """Aggregated submission counts and funding totals for an award recommendation."""

    total_received_count: int
    recommended_for_funding_count: int
    recommended_without_funding_count: int
    not_recommended_count: int
    total_recommended_amount: Decimal
