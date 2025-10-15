import dataclasses
import uuid
from src.db.models.competition_models import Competition, Form


@dataclasses.dataclass
class CompetitionContainer:
    competition_with_all_forms: Competition

    form_specific_competitions: dict[uuid.UUID, tuple[Form, Competition]] = dataclasses.field(
        default_factory=dict
    )

    def add_form_competition(self, form: Form, competition: Competition) -> None:
        self.form_specific_competitions[form.form_id] = form, competition
