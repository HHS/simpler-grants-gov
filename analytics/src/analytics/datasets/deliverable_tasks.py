from typing import Optional

import pandas as pd
from numpy import datetime64

from analytics.datasets.base import BaseDataset


class DeliverableTasks(BaseDataset):
    """Stores 30k ft deliverables and the tasks needed to complete them"""

    def __init__(self, df: pd.DataFrame) -> None:
        """Initializes the DeliverableTasks dataset"""
        super().__init__(df)
