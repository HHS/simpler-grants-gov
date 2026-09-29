from datetime import datetime

EXPECTED_FORM_DATA = {
    713: {
        "form_name": "Application for Federal Assistance (SF-424)",
        "omb_number": "4040-0004",
        "expiration_date": "03/31/2029",
    },
    241: {
        "form_name": "Budget Information for Non-Construction Programs (SF-424A)",
        "omb_number": "4040-0006",
        "expiration_date": "06/30/2028",
    },
    238: {
        "form_name": "Assurances for Construction Programs (SF-424D)",
        "omb_number": "4040-0009",
        "expiration_date": "06/30/2028",
    },
    240: {
        "form_name": "Assurances for Non-Construction Programs (SF-424B)",
        "omb_number": "4040-0007",
        "expiration_date": "07/31/2028",
    },
    670: {
        "form_name": "Disclosure of Lobbying Activities (SF-LLL)",
        "omb_number": "4040-0013",
        "expiration_date": "06/30/2028",
    },
    255: {
        "form_name": "Grants.gov Lobbying Form",
        "omb_number": "4040-0013",
        "expiration_date": "06/30/2028",
    },
    542: {
        "form_name": "Other Narrative Attachments",
        "omb_number": None,
        "expiration_date": None,
    },
    541: {
        "form_name": "Project Abstract",
        "omb_number": "4040-0010",
        "expiration_date": "12/31/2026",
    },
    276: {
        "form_name": "CD511",
        "omb_number": None,
        "expiration_date": None,
    },
    773: {
        "form_name": "EPA Form 4700-4",
        "omb_number": "2030-0020",
        "expiration_date": "02/28/2029",
    },
    674: {
        "form_name": "EPA KEY CONTACTS FORM",
        "omb_number": "2030-0020",
        "expiration_date": "02/28/2029",
    },
    530: {
        "form_name": "Supplementary Cover Sheet for NEH Grant Programs",
        "omb_number": "3136-0134",
        "expiration_date": "10/31/2027",
    },
    539: {
        "form_name": "Project Narrative Attachment Form",
        "omb_number": None,
        "expiration_date": None,
    },
    543: {
        "form_name": "Budget Narrative Attachment Form",
        "omb_number": None,
        "expiration_date": None,
    },
    591: {
        "form_name": "Project Abstract Summary",
        "omb_number": "4040-0019",
        "expiration_date": "06/30/2028",
    },
    540: {
        "form_name": "Attachment Form",
        "omb_number": None,
        "expiration_date": None,
    },
    408: {
        "form_name": "Budget Information for Construction Programs (SF-424C)",
        "omb_number": "4040-0008",
        "expiration_date": "06/30/2028",
    },
    711: {
        "form_name": "Application for Federal Domestic Assistance-Short Organizational (SF-424)",
        "omb_number": "4040-0003",
        "expiration_date": "07/31/2028",
    },
    # TODO this doesn't match the Confluence Doc
    723: {
        "form_name": "PROJECT/PERFORMANCE SITE LOCATION(S)",
        "omb_number": "4040-0010",
        "expiration_date": "08/31/2029",
        # "expiration_date": "12/31/2026",
    },
    # TODO this doesn't match the Confluence Doc
    683: {
        "form_name": "KEY CONTACTS",
        "omb_number": "4040-0010",
        "expiration_date": "08/31/2029",
        # "expiration_date": "12/31/2026",
    },
}


def test_sf424_v4_0(sf424_v4_0):
    expected_values = EXPECTED_FORM_DATA.get(sf424_v4_0.legacy_form_id)
    assert sf424_v4_0.omb_number == expected_values["omb_number"]
    assert (
        sf424_v4_0.expiration_date
        == datetime.strptime(expected_values["expiration_date"], "%m/%d/%Y").date()
    )
    assert sf424_v4_0.form_name == expected_values["form_name"]


def test_sf424_short_v3_0(sf424_short_v3_0):
    expected_values = EXPECTED_FORM_DATA.get(sf424_short_v3_0.legacy_form_id)
    assert sf424_short_v3_0.omb_number == expected_values["omb_number"]
    assert (
        sf424_short_v3_0.expiration_date
        == datetime.strptime(expected_values["expiration_date"], "%m/%d/%Y").date()
    )
    assert sf424_short_v3_0.form_name == expected_values["form_name"]


def test_sf424a_v1_0(sf424a_v1_0):
    expected_values = EXPECTED_FORM_DATA.get(sf424a_v1_0.legacy_form_id)
    assert sf424a_v1_0.omb_number == expected_values["omb_number"]
    assert (
        sf424a_v1_0.expiration_date
        == datetime.strptime(expected_values["expiration_date"], "%m/%d/%Y").date()
    )
    assert sf424a_v1_0.form_name == expected_values["form_name"]


def test_sf424b_v1_1(sf424b_v1_1):
    expected_values = EXPECTED_FORM_DATA.get(sf424b_v1_1.legacy_form_id)
    assert sf424b_v1_1.omb_number == expected_values["omb_number"]
    assert (
        sf424b_v1_1.expiration_date
        == datetime.strptime(expected_values["expiration_date"], "%m/%d/%Y").date()
    )
    assert sf424b_v1_1.form_name == expected_values["form_name"]


def test_sf424c_v2_0(sf424c_v2_0):
    expected_values = EXPECTED_FORM_DATA.get(sf424c_v2_0.legacy_form_id)
    assert sf424c_v2_0.omb_number == expected_values["omb_number"]
    assert (
        sf424c_v2_0.expiration_date
        == datetime.strptime(expected_values["expiration_date"], "%m/%d/%Y").date()
    )
    assert sf424c_v2_0.form_name == expected_values["form_name"]


def test_sf424d_v1_1(sf424d_v1_1):
    expected_values = EXPECTED_FORM_DATA.get(sf424d_v1_1.legacy_form_id)
    assert sf424d_v1_1.omb_number == expected_values["omb_number"]
    assert (
        sf424d_v1_1.expiration_date
        == datetime.strptime(expected_values["expiration_date"], "%m/%d/%Y").date()
    )
    assert sf424d_v1_1.form_name == expected_values["form_name"]


def test_sflll_v2_0(sflll_v2_0):
    expected_values = EXPECTED_FORM_DATA.get(sflll_v2_0.legacy_form_id)
    assert sflll_v2_0.omb_number == expected_values["omb_number"]
    assert (
        sflll_v2_0.expiration_date
        == datetime.strptime(expected_values["expiration_date"], "%m/%d/%Y").date()
    )
    assert sflll_v2_0.form_name == expected_values["form_name"]


def test_project_abstract_v1_2(project_abstract_v1_2):
    expected_values = EXPECTED_FORM_DATA.get(project_abstract_v1_2.legacy_form_id)
    assert project_abstract_v1_2.omb_number == expected_values["omb_number"]
    assert (
        project_abstract_v1_2.expiration_date
        == datetime.strptime(expected_values["expiration_date"], "%m/%d/%Y").date()
    )
    assert project_abstract_v1_2.form_name == expected_values["form_name"]


def test_project_abstract_summary_v2_0(project_abstract_summary_v2_0):
    expected_values = EXPECTED_FORM_DATA.get(project_abstract_summary_v2_0.legacy_form_id)
    assert project_abstract_summary_v2_0.omb_number == expected_values["omb_number"]
    assert (
        project_abstract_summary_v2_0.expiration_date
        == datetime.strptime(expected_values["expiration_date"], "%m/%d/%Y").date()
    )
    assert project_abstract_summary_v2_0.form_name == expected_values["form_name"]


def test_project_narrative_attachment_v1_2(project_narrative_attachment_v1_2):
    expected_values = EXPECTED_FORM_DATA.get(project_narrative_attachment_v1_2.legacy_form_id)
    assert project_narrative_attachment_v1_2.omb_number == expected_values["omb_number"]
    assert project_narrative_attachment_v1_2.expiration_date is None
    assert expected_values["expiration_date"] is None
    assert project_narrative_attachment_v1_2.form_name == expected_values["form_name"]


def test_budget_narrative_attachment_v1_2(budget_narrative_attachment_v1_2):
    expected_values = EXPECTED_FORM_DATA.get(budget_narrative_attachment_v1_2.legacy_form_id)
    assert budget_narrative_attachment_v1_2.omb_number == expected_values["omb_number"]
    assert budget_narrative_attachment_v1_2.expiration_date is None
    assert expected_values["expiration_date"] is None
    assert budget_narrative_attachment_v1_2.form_name == expected_values["form_name"]


def test_other_narrative_attachment_v1_2(other_narrative_attachment_v1_2):
    expected_values = EXPECTED_FORM_DATA.get(other_narrative_attachment_v1_2.legacy_form_id)
    assert other_narrative_attachment_v1_2.omb_number == expected_values["omb_number"]
    assert other_narrative_attachment_v1_2.expiration_date is None
    assert expected_values["expiration_date"] is None
    assert other_narrative_attachment_v1_2.form_name == expected_values["form_name"]


def test_cd511_v1_1(cd511_v1_1):
    expected_values = EXPECTED_FORM_DATA.get(cd511_v1_1.legacy_form_id)
    assert cd511_v1_1.omb_number == expected_values["omb_number"]
    assert cd511_v1_1.expiration_date is None
    assert expected_values["expiration_date"] is None
    assert cd511_v1_1.form_name == expected_values["form_name"]


def test_supplementary_neh_cover_sheet_v3_0(supplementary_neh_cover_sheet_v3_0):
    expected_values = EXPECTED_FORM_DATA.get(supplementary_neh_cover_sheet_v3_0.legacy_form_id)
    assert supplementary_neh_cover_sheet_v3_0.omb_number == expected_values["omb_number"]
    assert (
        supplementary_neh_cover_sheet_v3_0.expiration_date
        == datetime.strptime(expected_values["expiration_date"], "%m/%d/%Y").date()
    )
    assert supplementary_neh_cover_sheet_v3_0.form_name == expected_values["form_name"]


def test_gg_lobbying_form_v1_1(gg_lobbying_form_v1_1):
    expected_values = EXPECTED_FORM_DATA.get(gg_lobbying_form_v1_1.legacy_form_id)
    assert gg_lobbying_form_v1_1.omb_number == expected_values["omb_number"]
    assert (
        gg_lobbying_form_v1_1.expiration_date
        == datetime.strptime(expected_values["expiration_date"], "%m/%d/%Y").date()
    )
    assert gg_lobbying_form_v1_1.form_name == expected_values["form_name"]


def test_epa_form_4700_4_v5_0(epa_form_4700_4_v5_0):
    expected_values = EXPECTED_FORM_DATA.get(epa_form_4700_4_v5_0.legacy_form_id)
    assert epa_form_4700_4_v5_0.omb_number == expected_values["omb_number"]
    assert (
        epa_form_4700_4_v5_0.expiration_date
        == datetime.strptime(expected_values["expiration_date"], "%m/%d/%Y").date()
    )
    assert epa_form_4700_4_v5_0.form_name == expected_values["form_name"]


def test_epa_key_contact_v2_0(epa_key_contact_v2_0):
    expected_values = EXPECTED_FORM_DATA.get(epa_key_contact_v2_0.legacy_form_id)
    assert epa_key_contact_v2_0.omb_number == expected_values["omb_number"]
    assert (
        epa_key_contact_v2_0.expiration_date
        == datetime.strptime(expected_values["expiration_date"], "%m/%d/%Y").date()
    )
    assert epa_key_contact_v2_0.form_name == expected_values["form_name"]


def test_key_contacts_v2_0(key_contacts_v2_0):
    expected_values = EXPECTED_FORM_DATA.get(key_contacts_v2_0.legacy_form_id)
    assert key_contacts_v2_0.omb_number == expected_values["omb_number"]
    assert (
        key_contacts_v2_0.expiration_date
        == datetime.strptime(expected_values["expiration_date"], "%m/%d/%Y").date()
    )
    assert key_contacts_v2_0.form_name == expected_values["form_name"]


def test_attachment_form_v1_2(attachment_form_v1_2):
    expected_values = EXPECTED_FORM_DATA.get(attachment_form_v1_2.legacy_form_id)
    assert attachment_form_v1_2.omb_number == expected_values["omb_number"]
    assert attachment_form_v1_2.expiration_date is None
    assert expected_values["expiration_date"] is None
    assert attachment_form_v1_2.form_name == expected_values["form_name"]


def test_project_performance_site_location_v4_0(project_performance_site_location_v4_0):
    expected_values = EXPECTED_FORM_DATA.get(project_performance_site_location_v4_0.legacy_form_id)
    assert project_performance_site_location_v4_0.omb_number == expected_values["omb_number"]
    assert (
        project_performance_site_location_v4_0.expiration_date
        == datetime.strptime(expected_values["expiration_date"], "%m/%d/%Y").date()
    )
    assert project_performance_site_location_v4_0.form_name == expected_values["form_name"]
