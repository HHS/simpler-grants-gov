from src.db.models.legacy_mixin.certificates_mixin import TcertificatesMixin

from . import foreignbase


class Tcertificates(foreignbase.ForeignBase, TcertificatesMixin):
    __tablename__ = "tcertificates"
