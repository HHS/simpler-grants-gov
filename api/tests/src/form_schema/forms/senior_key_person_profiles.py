"""Helpers for testing the Senior/Key Person forms generated from forms/specs.

Each form keeps its own tests, fixtures and expectations. These build the data they share
the shape of: a person placed as the PD/PI or as a senior/key person, and a profile with
each of its fields set to one value.
"""

import copy

from src.db.models.competition_models import Form

# The question bank's length limits, which every Senior/Key Person profile shares. Each
# field also needs at least one character, except the email, which its format checks.
BANK_MAX_LENGTHS = {
    "name.prefix": 10,
    "name.first_name": 35,
    "name.middle_name": 25,
    "name.last_name": 60,
    "name.suffix": 10,
    "title": 45,
    "address.street1": 55,
    "address.street2": 55,
    "address.city": 35,
    "address.county": 30,
    "address.province": 30,
    "address.zip_code": 30,
    "phone": 25,
    "fax": 25,
    "email": 60,
    "department": 100,
    "division": 100,
}

# Where a profile sits on the form: the PD/PI, or the first senior/key person.
PEOPLE = ["principal_investigator", "senior_key_persons[0]"]

# An address outside the United States, which needs no state or ZIP code.
NON_US_ADDRESS = {
    "street1": "25 King's Parade",
    "city": "Cambridge",
    "province": "Cambridgeshire",
    "country": "GBR: UNITED KINGDOM",
}


def with_person(base: dict, person: str, profile: dict) -> dict:
    """A copy of `base` with `profile` as the PD/PI or as the only senior/key person."""
    data = copy.deepcopy(base)
    if person == "principal_investigator":
        data["principal_investigator"] = copy.deepcopy(profile)
    else:
        data["senior_key_persons"] = [copy.deepcopy(profile)]
    return data


def with_values(profile: dict, values: dict[str, object]) -> dict:
    """A copy of `profile` with each dotted path in `values` set, e.g. `name.prefix`."""
    profile = copy.deepcopy(profile)
    for path, value in values.items():
        *parents, field = path.split(".")
        target = profile
        for parent in parents:
            target = target.setdefault(parent, {})
        target[field] = value
    return profile


def field_paths(person: str, fields) -> list[str]:
    """Each field's path in a validation issue, e.g. `$.senior_key_persons[0].title`."""
    return [f"$.{person}.{field}" for field in fields]


def ui_rules(form: Form, field: str) -> list[dict]:
    """The rule on each control for `field`, the PD/PI's and the senior/key persons'."""
    rules = []

    def walk(node):
        if isinstance(node, dict):
            if node.get("scope", "").endswith(f"/properties/{field}") and "rule" in node:
                rules.append(node["rule"])
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)

    walk(form.form_ui_schema)
    return rules
