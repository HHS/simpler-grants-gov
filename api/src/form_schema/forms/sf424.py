from black import datetime

from src.db.models.competition_models import Form

SF424_v4_0 = Form(
    # legacy form ID - 713
    # https://www.grants.gov/forms/form-items-description/fid/713

    form_id="",
    form_name="Application for Federal Assistance (SF-424)",
    form_version="4.0",
    agency_code="SGG", # TODO - Do we want to add Simpler Grants.gov as an "Agency"?
    omb_number="4040-0004",
    form_json_schema={},
    #form_rule_schema={}, # TODO - once merged in
    form_ui_schema={},
    # TODO - form instructions?
)