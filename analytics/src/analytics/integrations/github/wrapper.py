"""Expose a wrapper class to collect roadmap data and the deliverable completion metrics."""



class ExportWrapper:
    """
    A wrapper class for the roadmap data and the parsed checkboxes containing metrics and
    Acceptance criteria.

    Attributes
    ----------
    roadmap : list
        List of base roadmap data.
    deliverables : list
        List of checkboxes for Metrics and Acceptance Criteria and their completeness.

    """

    def __init__(self, graph_data: list[dict], deliverables: list[dict]) -> None:
        """Initialize the wrapper class."""
        self.graph_data = graph_data
        self.deliverables = deliverables

