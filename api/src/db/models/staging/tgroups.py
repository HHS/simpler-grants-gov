from src.db.models.legacy_mixin import tgroups_mixin
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin


class Tgroups(StagingBase, tgroups_mixin.TGroupsMixin, StagingParamMixin):
    __tablename__ = "tgroups"

    def get_agency_code(self) -> str:
        # The keyfield is formatted as:
        # Agency-<AGENCY CODE>-<field name>
        # so to get the agency code, we need to parse out the middle bit
        # so we split and drop the first + last field and rejoin it.
        tokens = self.keyfield.split("-")
        return "-".join(tokens[1:-1])

    def get_field_name(self) -> str:
        return self.keyfield.split("-")[-1]
